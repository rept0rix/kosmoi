import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // Assuming react-dropzone is available or I'll implement simple drag/drop
import { Upload, FileVideo, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const VideoUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error'
    const [message, setMessage] = useState('');

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus(null);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/ingest', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed');
            }

            setUploadStatus('success');
            setMessage(`Successfully ingested: ${file.name}`);
        } catch (error) {
            console.error('Upload Error:', error);
            setUploadStatus('error');
            setMessage(error.message || 'Failed to upload video');
        } finally {
            setUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'video/*': [],
            'audio/*': []
        },
        multiple: false
    });

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-purple-400" />
                Upload Knowledge
            </h3>

            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                    ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-purple-400 hover:bg-white/5'}
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center py-4">
                        <Loader className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                        <p className="text-slate-300">Processing video...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-2">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-slate-200 font-medium">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-400 mt-1">Video or Audio files (MP4, MP3, WAV)</p>
                    </div>
                )}
            </div>

            {message && (
                <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm ${uploadStatus === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
                    }`}>
                    {uploadStatus === 'success' ? (
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
};

export default VideoUpload;
