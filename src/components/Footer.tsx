"use client";

import { useState } from "react";
import { Gamepad2, X, Mail, ShieldCheck, FileText } from "lucide-react";

type ModalType = "privacy" | "terms" | "contact" | null;

export default function Footer() {
  const [modal, setModal] = useState<ModalType>(null);

  const closeModal = () => setModal(null);

  return (
    <>
      <footer className="w-full border-t border-white/10 bg-background/80 backdrop-blur-md py-8 mt-12 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <Gamepad2 className="w-6 h-6 text-violet-500" />
            <span className="font-outfit text-xl font-bold text-foreground">
              KURA
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} KURA Video Game Discovery. Built with Next.js & RAWG API.
          </p>

          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => setModal("privacy")} className="hover:text-violet-500 transition-colors">Privacy</button>
            <button onClick={() => setModal("terms")} className="hover:text-violet-500 transition-colors">Terms</button>
            <button onClick={() => setModal("contact")} className="hover:text-violet-500 transition-colors">Contact</button>
          </div>
        </div>
      </footer>

      {/* Modal Overlay */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                {modal === "privacy" && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
                {modal === "terms" && <FileText className="w-6 h-6 text-blue-500" />}
                {modal === "contact" && <Mail className="w-6 h-6 text-violet-500" />}
                <h2 className="text-xl font-bold text-foreground capitalize">
                  {modal === "privacy" ? "Privacy Policy" : modal === "terms" ? "Terms of Service" : "Contact Us"}
                </h2>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-8 overflow-y-auto text-sm text-foreground/80 leading-relaxed custom-scrollbar">
              {modal === "privacy" && (
                <div className="space-y-4">
                  <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
                  <p>Welcome to KURA. We are committed to protecting your personal information and your right to privacy.</p>
                  
                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">1. Information We Collect</h3>
                  <p>We collect personal information that you provide to us when you register on KURA, including your Google account details (name, email, and profile picture) to facilitate authentication.</p>
                  
                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">2. How We Use Your Information</h3>
                  <p>We use the information we collect to operate, maintain, and improve our platform. This includes personalizing your gaming recommendations, managing your game library (Backlog), and enabling community interactions.</p>

                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">3. Data Sharing & Security</h3>
                  <p>We do not sell your personal data to third parties. We use Firebase (Google Cloud) to securely store your data and ensure it is protected through industry-standard encryption protocols.</p>

                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">4. Third-Party APIs</h3>
                  <p>KURA utilizes the RAWG Video Games Database API to fetch game information. We do not share your identifiable data with RAWG.</p>
                </div>
              )}

              {modal === "terms" && (
                <div className="space-y-4">
                  <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
                  <p>By accessing or using KURA, you agree to be bound by these Terms of Service.</p>
                  
                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">1. User Conduct & Community Guidelines</h3>
                  <p>KURA is built for gamers to share their passion. You agree not to post content that is illegal, abusive, harassing, or discriminatory. Our administrators reserve the right to remove any toxic comments or posts without prior notice.</p>
                  
                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">2. Account Termination</h3>
                  <p>We reserve the right to suspend or terminate your account if you violate these terms, particularly regarding abusive behavior in the Global Town Square.</p>

                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">3. Intellectual Property</h3>
                  <p>All game metadata, images, and artwork displayed on KURA belong to their respective copyright holders and are sourced via the RAWG API under their terms of use. KURA does not claim ownership of these assets.</p>

                  <h3 className="text-base font-bold text-foreground mt-6 mb-2">4. Disclaimer of Warranties</h3>
                  <p>KURA is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free.</p>
                </div>
              )}

              {modal === "contact" && (
                <div className="space-y-6 text-center py-6">
                  <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                    <Mail className="w-8 h-8 text-violet-500" />
                  </div>
                  <h3 className="text-2xl font-black font-outfit text-foreground">Get in Touch</h3>
                  <p className="max-w-md mx-auto text-muted-foreground">
                    Have a question, feedback, or need help with your account? We&apos;d love to hear from you.
                  </p>
                  <div className="bg-card border border-border rounded-xl p-4 max-w-sm mx-auto shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Us At</p>
                    <a href="mailto:support@kura.games" className="text-lg font-bold text-violet-500 hover:text-violet-400 transition-colors">
                      support@kura.games
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Our team usually responds within 24-48 hours.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-background flex justify-end">
              <button 
                onClick={closeModal}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
