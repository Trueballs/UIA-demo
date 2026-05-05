'use client';

import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function InstagramPostsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadPost = async (postId: string) => {
    setDownloading(postId);
    try {
      const element = document.getElementById(postId);
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `instagram-post-${postId}.png`;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F1] font-sans flex justify-center w-full px-4 md:px-8 xl:px-12 py-4 md:py-6 gap-6 xl:gap-8 box-border overflow-x-hidden">
      <main className="w-full xl:w-[60%] flex flex-col shrink-0 relative bg-[#F5F4F1]">
        <Header showBackButton />

        <div className="w-full px-4 md:px-8 pt-12 md:pt-16 pb-24">
          <h1 className="text-5xl md:text-7xl font-black text-[#1e2d78] uppercase tracking-tighter mb-4 font-[family-name:var(--font-playful)]">Instagram Posts</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em] mb-12">6 professional posts ready to download and share</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* POST 1: STEP 1 */}
            <div id="post-1" className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col h-[500px]">
              <div className="w-full h-full flex flex-col p-8 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
                  <span className="bg-[#0A66C2] text-white text-xs font-bold px-3 py-1 rounded-full">Step 1 of 3</span>
                </div>
                <h2 className="text-2xl font-black text-[#111827] mb-1 leading-tight">Create Your Perfect Banner</h2>
                <p className="text-gray-600 text-xs mb-6 font-medium">Professional banners in seconds</p>
                <div className="flex-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg overflow-hidden">
                  <div className="text-center text-white">
                    <p className="text-3xl mb-1 text-white">✨</p>
                    <p className="text-lg font-bold">Generate</p>
                    <p className="text-xs opacity-90">With AI</p>
                  </div>
                </div>
                <p className="text-gray-700 text-xs mb-3 font-medium">
                  Choose your university, select a layout, and let our AI generate a stunning banner for your profile. 
                </p>
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <button onClick={() => downloadPost('post-1')} disabled={downloading === 'post-1'} className="w-full bg-[#0A66C2] text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-sm">
                    {downloading === 'post-1' ? 'Downloading...' : '↓ Download'}
                  </button>
                </div>
              </div>
            </div>

            {/* POST 2: STEP 2 */}
            <div id="post-2" className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col h-[500px]">
              <div className="w-full h-full flex flex-col p-8 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
                  <span className="bg-[#0A66C2] text-white text-xs font-bold px-3 py-1 rounded-full">Step 2 of 3</span>
                </div>
                <h2 className="text-2xl font-black text-[#111827] mb-1 leading-tight">Customize Everything</h2>
                <p className="text-gray-600 text-xs mb-6 font-medium">Make it uniquely yours</p>
                <div className="flex-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg overflow-hidden">
                  <div className="text-center text-white">
                    <p className="text-3xl mb-1">🎨</p>
                    <p className="text-lg font-bold">Customize</p>
                    <p className="text-xs opacity-90">Colors & Text</p>
                  </div>
                </div>
                <p className="text-gray-700 text-xs mb-3 font-medium">
                  Edit layouts, swap photos, change colors, and personalize your headline. Preview changes instantly.
                </p>
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <button onClick={() => downloadPost('post-2')} disabled={downloading === 'post-2'} className="w-full bg-[#0A66C2] text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-sm">
                    {downloading === 'post-2' ? 'Downloading...' : '↓ Download'}
                  </button>
                </div>
              </div>
            </div>

            {/* POST 3: STEP 3 */}
            <div id="post-3" className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col h-[500px]">
              <div className="w-full h-full flex flex-col p-8 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
                  <span className="bg-[#0A66C2] text-white text-xs font-bold px-3 py-1 rounded-full">Step 3 of 3</span>
                </div>
                <h2 className="text-2xl font-black text-[#111827] mb-1 leading-tight">Download & Share</h2>
                <p className="text-gray-600 text-xs mb-6 font-medium">Go viral on LinkedIn</p>
                <div className="flex-1 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg overflow-hidden">
                  <div className="text-center text-white">
                    <p className="text-3xl mb-1">🚀</p>
                    <p className="text-lg font-bold">Share</p>
                    <p className="text-xs opacity-90">Post & Engage</p>
                  </div>
                </div>
                <p className="text-gray-700 text-xs mb-3 font-medium">
                  Download your banner as PNG, post on LinkedIn, and watch the engagement roll in.
                </p>
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <button onClick={() => downloadPost('post-3')} disabled={downloading === 'post-3'} className="w-full bg-[#0A66C2] text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-sm">
                    {downloading === 'post-3' ? 'Downloading...' : '↓ Download'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="bg-blue-50 border-l-4 border-[#0A66C2] p-8 rounded-3xl">
              <h3 className="font-bold text-[#111827] mb-3 text-lg">📥 How to Download</h3>
              <ol className="text-gray-700 space-y-3 font-medium">
                <li>✅ Click "Download" button on any post</li>
                <li>✅ Image saves automatically</li>
                <li>✅ Upload to Instagram Stories or Feed</li>
                <li>✅ Watch engagement grow! 📈</li>
              </ol>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-8 rounded-3xl">
              <h3 className="font-bold text-[#111827] mb-3 text-lg">💡 Pro Tips</h3>
              <ul className="text-gray-700 space-y-3 font-medium">
                <li>✨ Post 3x per week for best results</li>
                <li>🎯 Mix up the post types</li>
                <li>📱 Use Carousel format on Instagram</li>
                <li>⏰ Post during peak hours (9-11am)</li>
              </ul>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
