import React from 'react';
import { Zap, Cpu, Rocket, Check } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500 selection:text-black">
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-black tracking-tighter">
                    BANANA<span className="text-yellow-400">AI</span>
                </div>
                <button className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-bold transition-transform active:scale-95">
                    Get Started
                </button>
            </nav>

            {/* Hero Section */}
            <header className="px-8 pt-20 pb-32 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center space-x-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-1.5 mb-8">
                    <span className="flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">The One Dollar Challenge</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-tight">
                    Intelligence for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Less Than a Coffee.</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                    Deploy autonomous agents, generate assets, and optimize your workflow with the power of the Banana Neural Engine.
                </p>
                <div className="flex justify-center gap-4">
                    <button className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                        Start Building
                    </button>
                    <button className="px-8 py-4 rounded-xl font-bold text-lg border border-gray-800 hover:bg-gray-900 transition-all flex items-center">
                        <Cpu className="mr-2" size={20} />
                        View Demo
                    </button>
                </div>
            </header>

            {/* Features Grid */}
            <section className="bg-gray-900/50 py-24 px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: Zap, title: "Instant Deploy", desc: "From prompt to production in seconds." },
                        { icon: Rocket, title: "Scalable Core", desc: "Built on the Nano Banana architecture." },
                        { icon: Cpu, title: "Neural Synergy", desc: "Agents that actually talk to each other." }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-black border border-gray-800 hover:border-yellow-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
