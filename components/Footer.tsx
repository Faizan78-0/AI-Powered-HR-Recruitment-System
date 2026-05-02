"use client";
import React from 'react'

const Footer = () => {
  return (
    <>
    <div className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="font-bold text-white text-xs">T</span>
            </div>
            <span className="font-bold text-slate-900">TalentAI</span>
          </div>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} TalentAI Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-slate-400">
             <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
             <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
             <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Footer
