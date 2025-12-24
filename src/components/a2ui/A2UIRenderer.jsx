
import React, { Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- A2UI Component Registry ---
// Maps "string" types from the JSON to actual React Components.

const ComponentRegistry = {
    // Basic Layout
    'container': ({ children, className, style }) => <div className={className} style={style}>{children}</div>,
    'row': ({ children, className }) => <div className={`flex flex-row gap-2 ${className || ''}`}>{children}</div>,
    'col': ({ children, className }) => <div className={`flex flex-col gap-2 ${className || ''}`}>{children}</div>,

    // Typography
    'text': ({ content, className }) => <span className={className}>{content}</span>,
    'heading': ({ content, level = 1, className, ...props }) => {
        const Tag = `h${Math.min(level, 6)}`;
        const sizes = { 1: 'text-3xl font-bold', 2: 'text-2xl font-bold', 3: 'text-xl font-semibold' };
        // Validating that Tag is a known HTML element (h1-h6) which is valid JSX
        return React.createElement(Tag, {
            className: `scroll-m-20 tracking-tight ${sizes[level] || ''} ${className || ''}`,
            ...props
        }, content);
    },

    // Interactive
    'button': (props) => <Button {...props}>{props.label || props.children}</Button>,
    'input': (props) => <div className="grid w-full max-w-sm items-center gap-1.5">
        {props.label && <Label htmlFor={props.id}>{props.label}</Label>}
        <Input {...props} />
    </div>,

    // Data Display
    'card': ({ title, description, content, footer, className }) => (
        <Card className={className}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>
                {/* If content is a string, render text. If it's an A2UI node, the recursive renderer handles it via children prop */}
                {content}
            </CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
    ),
    'badge': (props) => <Badge {...props}>{props.label || props.children}</Badge>,
    'alert': ({ title, children, variant = "default" }) => {
        // Explicit check to satisfy type inference (string vs literal union)
        const safeVariant = (variant === "destructive") ? "destructive" : "default";

        return (
            <Alert variant={safeVariant}>
                {title && <AlertTitle>{title}</AlertTitle>}
                <AlertDescription>{children}</AlertDescription>
            </Alert>
        );
    },

    // --- Data Visualization (Recharts) ---
    'bar-chart': ({ data, dataKey, categories, colors = ["#3b82f6", "#10b981", "#f59e0b"], height = 300 }) => (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={dataKey || "name"} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f1f5f9' }}
                    />
                    <Legend />
                    {(categories || Object.keys(data[0] || {}).filter(k => k !== (dataKey || "name"))).map((key, i) => (
                        <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    ),
    'line-chart': ({ data, dataKey, categories, colors = ["#3b82f6", "#10b981", "#f59e0b"], height = 300 }) => (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={dataKey || "name"} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    {(categories || Object.keys(data[0] || {}).filter(k => k !== (dataKey || "name"))).map((key, i) => (
                        <Line type="monotone" key={key} dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    ),
    'area-chart': ({ data, dataKey, categories, colors = ["#3b82f6", "#10b981", "#f59e0b"], height = 300 }) => (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={dataKey || "name"} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {(categories || Object.keys(data[0] || {}).filter(k => k !== (dataKey || "name"))).map((key, i) => (
                        <Area type="monotone" key={key} dataKey={key} stackId="1" stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.6} />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    ),
    'pie-chart': ({ data, dataKey, nameKey, colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"], height = 300 }) => (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey={dataKey || "value"}
                        nameKey={nameKey || "name"}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    ),

    // --- Complex Components ---
    'stat-card': ({ title, value, change, trend, icon, description }) => {
        const icons = { dollar: DollarSign, users: Users, activity: Activity };
        const Icon = icons[icon] || Activity;
        const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';
        const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    {(change || description) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            {TrendIcon && <TrendIcon className={`h-3 w-3 ${trendColor}`} />}
                            <span className={trendColor}>{change}</span>
                            {description && <span className="ml-1 opacity-70">{description}</span>}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    },

    'data-table': ({ headers, rows, caption }) => (
        <div className="rounded-md border bg-white">
            <Table>
                {caption && <TableCaption>{caption}</TableCaption>}
                <TableHeader>
                    <TableRow>
                        {headers.map((h, i) => <TableHead key={i}>{h}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i}>
                            {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    ),
    'unknown': ({ type }) => <div className="p-2 border border-red-200 bg-red-50 text-red-500 text-xs rounded">Unknown Component: {type}</div>
};

/**
 * Recursive Renderer for A2UI Nodes
 */
const A2UINode = ({ node }) => {
    if (!node) return null;

    // Handle Primitives
    if (typeof node === 'string' || typeof node === 'number') {
        return <>{node}</>;
    }

    // Handle Arrays (Fragment)
    if (Array.isArray(node)) {
        return <>{node.map((child, i) => <A2UINode key={i} node={child} />)}</>;
    }

    const { type, props = {}, children } = node;

    const Component = ComponentRegistry[type] || ComponentRegistry['unknown'];

    // Recursively render children
    // We pass 'children' as a prop AND as React children for flexibility
    const renderedChildren = children ? <A2UINode node={children} /> : null;

    return (
        <Component {...props} type={type}>
            {renderedChildren || props.children}
        </Component>
    );
};

/**
 * Main Entry Point
 * @param {object} content - The A2UI JSON payload
 */
export const A2UIRenderer = ({ content }) => {
    // Error Boundary could go here
    if (!content) return null;

    return (
        <div className="a2ui-root w-full my-2 animate-in fade-in duration-500">
            <A2UINode node={content} />
        </div>
    );
};

export default A2UIRenderer;
