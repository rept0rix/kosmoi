
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        // Note: If @base44/sdk is not available in your environment, you can use standard Supabase auth headers.
        // For now, we stick to the user's provided code.
        const base44 = createClientFromRequest(req);

        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const prompt = body.prompt;
        const aspectRatio = body.aspectRatio || 'auto';
        const resolution = body.resolution || '4K';
        const referenceImage = body.referenceImage;

        if (!prompt) {
            return Response.json({ error: 'Missing prompt' }, { status: 400 });
        }

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
        }

        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

        console.log('Sending request to Gemini');
        console.log('Prompt:', prompt);
        console.log('Resolution:', resolution);
        console.log('Aspect Ratio:', aspectRatio);

        const parts = [];

        // Text first
        parts.push({ text: prompt });

        // Then image if exists
        if (referenceImage) {
            let mimeType = 'image/jpeg';
            let data;

            if (typeof referenceImage === 'string') {
                const match = referenceImage.match(
                    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
                );
                if (match) {
                    mimeType = match[1];
                    data = match[2];
                } else {
                    data = referenceImage;
                }
            } else {
                data = referenceImage.data;
                mimeType = referenceImage.mimeType || mimeType;
            }

            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data,
                },
            });
        }

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                temperature: 1,
                imageConfig: {
                    imageSize: resolution,
                },
            },
        };

        if (aspectRatio && aspectRatio !== 'auto') {
            requestBody.generationConfig.imageConfig.aspectRatio = aspectRatio;
        }

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(requestBody),
        });

        if (!geminiResponse.ok) {
            const text = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, text);
            return Response.json({
                error: 'Gemini API error',
                status: geminiResponse.status,
                details: text,
            }, { status: 500 });
        }

        const data = await geminiResponse.json();
        console.log('Gemini response received');

        const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
        const inline = responseParts.find((p) => p.inlineData || p.inline_data);
        const base64 = inline?.inlineData?.data ?? inline?.inline_data?.data ?? null;

        if (!base64) {
            console.error('No image data in response');
            return Response.json({
                error: 'No image data in response',
                responseData: data
            }, { status: 500 });
        }

        return Response.json({ imageBase64: base64 }, { status: 200 });
    } catch (err) {
        console.error('Error in generateImageNanoBananaPro:', err);
        return Response.json({
            error: 'Server error',
            details: String(err),
            message: err.message
        }, { status: 500 });
    }
});
