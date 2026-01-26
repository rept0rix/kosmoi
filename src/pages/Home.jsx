import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  ArrowRight,
  Hotel,
  Utensils,
  Car,
  Hammer,
  ShoppingBag,
  Sparkles,
  Briefcase,
  Brain,
  Zap,
  Shield,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SubtleLocationIndicator from "@/components/SubtleLocationIndicator";
import LeadCaptureForm from "@/components/forms/LeadCaptureForm";

export default function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n?.dir ? i18n.dir() === "rtl" : false;

  // Samui Background Image (High Quality Night Market / Street Vibe)
  // Source: Unsplash (Thailand Street)
  const BG_IMAGE =
    "https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?q=80&w=2832&auto=format&fit=crop";

  const handleInteraction = () => {
    // Force redirect to App (which handles Auth)
    navigate("/app");
  };

  const categories = [
    {
      id: "hotels",
      label: t("categories.hotels"),
      icon: Hotel,
      color: "text-rose-400",
    },
    {
      id: "food",
      label: t("categories.food"),
      icon: Utensils,
      color: "text-orange-400",
    },
    {
      id: "transport",
      label: t("categories.transport"),
      icon: Car,
      color: "text-blue-400",
    },
    {
      id: "pro",
      label: t("categories.pro"),
      icon: Hammer,
      color: "text-yellow-400",
    },
    {
      id: "secondhand",
      label: t("categories.secondhand"),
      icon: ShoppingBag,
      color: "text-green-400",
    },
    {
      id: "ai",
      label: t("categories.ai"),
      icon: Sparkles,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen relative font-sans text-white">
      <SEO title={t("home.seo_title")} description={t("home.seo_desc")} />
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt="Samui Background"
          className="w-full h-full object-cover"
        />
        {/* Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"></div>
      </div>

      {/* Header / Logo */}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-32 pb-12">
        {/* Hero Headings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 max-w-4xl mx-auto px-2"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Intelligent Guide Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-medium text-slate-300">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>{t("home.city_guide")}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-tight">
            {t("home.hero_title")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {t("home.hero_title_suffix")}
            </span>
          </h1>

          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto px-4">
            {t("home.hero_subtitle")}
          </p>
        </motion.div>

        {/* Input Field (Fake Input that redirects) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-2xl mt-8 md:mt-12 relative group px-2"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1.5 md:p-2 flex items-center shadow-2xl">
            <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-300 ml-2 md:ml-4" />
            <input
              type="text"
              placeholder={t(
                "home.search_placeholder",
                "Search for villas, food, drivers...",
              )}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 h-10 md:h-12 px-2 md:px-4 text-base md:text-lg outline-none min-w-0"
              onKeyDown={(e) => e.key === "Enter" && navigate("/marketplace")}
            />
            <Button
              onClick={() => navigate("/marketplace")}
              className="rounded-full px-4 md:px-8 bg-white text-slate-900 hover:bg-slate-200 font-bold h-9 md:h-auto text-sm md:text-base"
            >
              {t("common.search", "Find")}
            </Button>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-12 w-full max-w-6xl"
        >
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.id === "ai") {
                  navigate("/marketplace");
                } else {
                  handleInteraction();
                }
              }}
              className="flex flex-col items-center justify-center w-[140px] h-[100px] p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all group hover:-translate-y-1"
            >
              <cat.icon
                className={`w-6 h-6 mb-2 ${cat.color} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}
              />
              <span className="text-sm font-medium text-slate-300 group-hover:text-white text-center leading-tight px-1">
                {cat.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* --- Comparison / Features Section --- */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl mt-32 mb-20"
        >
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              {t("home.why_pro_title", "Unlock the Island's Full Potential")}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t(
                "home.why_pro_subtitle",
                "Kosmoi isn't just a map. It's your unfair advantage on Koh Samui.",
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-10 h-10 text-purple-400" />,
                title: "AI Concierge",
                desc: 'Ask "Where\'s the best Pad Thai?" and get a real answer, not a sponsored list.',
              },
              {
                icon: <Zap className="w-10 h-10 text-yellow-400" />,
                title: "Instant Booking",
                desc: "Skip the WhatsApp tag. Book bikes, tables, and tours directly.",
              },
              {
                icon: <Shield className="w-10 h-10 text-emerald-400" />,
                title: "Verified Listings",
                desc: "No more closed businesses or fake reviews. We verify every spot.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="mb-6 bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Business CTA - Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 text-center"
        >
          <p className="text-slate-400 text-sm mb-3">
            {t("home.business_cta")}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/business")}
            className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm px-6"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            {t("home.join_city_os")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
