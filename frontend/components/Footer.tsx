import { Shield, Mail, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#FAF6F0]/90 border-t border-[#EAE3D2] text-[#2C2621] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2C2621] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#FAF6F0]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[#2C2621]">
              Deepfake Detect
            </span>
          </div>

          {/* Policy & Social Contact */}
          <div className="flex items-center gap-6 text-xs text-[#5C5246]">
            <a 
              href="#" 
              className="hover:text-[#2C2621] transition-colors"
            >
              Chính sách bảo mật
            </a>

            <div className="h-3 w-[1px] bg-[#EAE3D2]" />

            <div className="flex items-center gap-2">
              {/* Email */}
              <a
                href="mailto:nguyennhathoang1710@gmail.com"
                title="nguyennhathoang1710@gmail.com"
                className="p-1.5 rounded-lg bg-white border border-[#EAE3D2] hover:text-[#2C2621] hover:border-[#D8CEBE] transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/hoang-nguyen-5b9400363/"
                target="_blank"
                rel="noreferrer"
                title="LinkedIn"
                className="p-1.5 rounded-lg bg-white border border-[#EAE3D2] hover:text-[#2C2621] hover:border-[#D8CEBE] transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/hoangnguyen1017/helmet_detection"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
                className="p-1.5 rounded-lg bg-white border border-[#EAE3D2] hover:text-[#2C2621] hover:border-[#D8CEBE] transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}