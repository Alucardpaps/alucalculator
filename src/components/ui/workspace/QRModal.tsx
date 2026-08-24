'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Printer } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title: string;
}

export const QRModal = ({ isOpen, onClose, data, title }: QRModalProps) => {
  const qrString = JSON.stringify(data);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0a1018] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#00e5ff]">
                  Production Vector
                </h3>
                <p className="text-[10px] text-white/40 font-mono uppercase">{title}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Body */}
            <div className="p-8 flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.2)] mb-8">
                <QRCodeSVG
                  value={qrString}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/hexagon-icon.svg", // Reusing the logo if it exists
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="w-full space-y-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="block text-[9px] font-mono text-white/20 uppercase mb-2 tracking-widest">Payload Preview</span>
                  <pre className="text-[10px] font-mono text-white/50 overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/5 hover:bg-white/5 text-white/40 hover:text-[#00e5ff] transition-all group">
                    <Download size={16} />
                    <span className="text-[8px] uppercase tracking-widest font-bold">Vector</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/5 hover:bg-white/5 text-white/40 hover:text-[#00e5ff] transition-all group">
                    <Printer size={16} />
                    <span className="text-[8px] uppercase tracking-widest font-bold">Label</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/5 hover:bg-white/5 text-white/40 hover:text-[#00e5ff] transition-all group">
                    <Share2 size={16} />
                    <span className="text-[8px] uppercase tracking-widest font-bold">Cloud</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent opacity-30" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
