"use client";
import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Add your Firebase/Backend logic here
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="max-w-4xl mx-auto px-6 py-24">
        
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Support</h1>
            <p className="text-gray-400">Technical issue or business inquiry? We're here to help.</p>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl">
          {submitted ? (
            <div className="text-center py-20">
                <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-gray-400">We'll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-blue-400 hover:underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                        <input type="text" required className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Dr. John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <input type="email" required className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="john@example.com" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                    <select className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors">
                        <option>Technical Support</option>
                        <option>Partnership Inquiry</option>
                        <option>Report a Bug</option>
                        <option>Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                    <textarea required rows={5} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="How can we help you?" />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                    Send Message <Send className="w-4 h-4" />
                </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}