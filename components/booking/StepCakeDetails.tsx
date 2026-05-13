"use client";

import { useState, useRef, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Check, Upload, X, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface CakeDetails {
  size: string;
  flavor: string;
  type: string;
  designStyle: string[];
  message: string;
  specialInstructions: string;
  referencePhotoUrl: string;
  retailPrice: number;
}

interface StepCakeDetailsProps {
  onNext: (data: { customCakeDetails: CakeDetails }) => void;
  onBack: () => void;
  initialData?: CakeDetails;
}

const SIZES = [
  { label: '6" - Serves 4-6', price: 40, value: '6"' },
  { label: '7" - Serves 8-10', price: 45, value: '7"' },
  { label: '8" - Serves 10-12', price: 55, value: '8"' },
  { label: '9" - Serves 12-15', price: 75, value: '9"' },
  { label: '10" - Serves 20-25', price: 95, value: '10"' },
  { label: '11" - Serves 25+', price: 120, value: '11"' },
  { label: '12" - Serves 30-35', price: 150, value: '12"' },
  { label: '14" - Serves 40-45', price: 200, value: '14"' }
];

const FLAVORS = [
  "Classic Vanilla Bean",
  "Rich Chocolate Fudge",
  "Red Velvet & Cream Cheese",
  "Lemon Raspberry",
  "Strawberry Shortcake",
  "Salted Caramel Pecan"
];

const DESIGN_STYLES = [
  "Simple & Elegant",
  "Colorful & Fun",
  "Modern & Trendy",
  "Theme-based",
  "Custom Design"
];

export const StepCakeDetails = ({ onNext, onBack, initialData }: StepCakeDetailsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [details, setDetails] = useState<CakeDetails>(initialData || {
    size: "",
    flavor: "",
    type: "With Egg",
    designStyle: [],
    message: "",
    specialInstructions: "",
    referencePhotoUrl: "",
    retailPrice: 0
  });

  const handleSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedSize = SIZES.find(s => s.value === selectedValue);
    setDetails(prev => ({
      ...prev,
      size: selectedValue,
      retailPrice: selectedSize ? selectedSize.price : 0
    }));
  };

  const handleDesignStyleToggle = (style: string) => {
    setDetails(prev => ({
      ...prev,
      designStyle: prev.designStyle.includes(style)
        ? prev.designStyle.filter(s => s !== style)
        : [...prev.designStyle, style]
    }));
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be up to 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const base64 = await toBase64(file);
      const { data } = await api.post("/bookings/upload-cake-photo", {
        imageBase64: base64
      });

      if (data.success) {
        setDetails(prev => ({ ...prev, referencePhotoUrl: data.url }));
        toast.success("Photo uploaded successfully!");
      } else {
        toast.error("Failed to upload photo.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "An error occurred while uploading. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!details.size) {
      toast.error("Please select a cake size.");
      return;
    }
    if (!details.flavor) {
      toast.error("Please select a cake flavor.");
      return;
    }
    onNext({ customCakeDetails: details });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      
      <div className="glass-card-high rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Top embellishment */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
        
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎂</span>
          <h2 className="font-headline italic text-2xl text-on-surface">The <span className="text-gold-gradient">Celebration</span> Cake</h2>
        </div>
        <p className="font-body text-on-surface/50 text-xs mb-8">Select your cake size and customize the design</p>

        {/* Cake Size */}
        <div className="space-y-2 mb-6">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Cake Size *</label>
          <div className="relative group">
            <select 
              value={details.size}
              onChange={handleSizeChange}
              className="w-full bg-surface-container/50 border border-outline-variant/20 text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-background">Select a size...</option>
              {SIZES.map(s => (
                <option key={s.value} value={s.value} className="bg-background">{s.label} (Price: ${s.price})</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary group-hover:text-gold-gradient transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        {/* Retail Price Display */}
        <div className="mb-6 bg-emerald-gradient border-l-4 border-gold-gradient rounded-r-lg p-4 flex justify-between items-center transition-all duration-300">
          <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-primary/70">Retail Price:</span>
          <span className="font-headline italic text-xl text-gold-gradient">
            {details.retailPrice ? `$${details.retailPrice}.00` : "--"}
          </span>
        </div>

        {/* Cake Flavor */}
        <div className="space-y-2 mb-6">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Cake Flavor *</label>
          <div className="relative group">
            <select 
              value={details.flavor}
              onChange={(e) => setDetails({...details, flavor: e.target.value})}
              className="w-full bg-surface-container/50 border border-outline-variant/20 text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-background">Select a flavor...</option>
              {FLAVORS.map(f => (
                <option key={f} value={f} className="bg-background">{f}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary group-hover:text-gold-gradient transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        {/* Cake Type */}
        <div className="space-y-4 mb-8">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Cake Type</label>
          <div className="flex flex-col gap-3">
            {[ "With Egg", "Eggless" ].map(type => (
              <label 
                key={type} 
                onClick={() => setDetails(prev => ({ ...prev, type }))}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300",
                  details.type === type ? "border-primary bg-primary/10" : "border-outline-variant/10 glass-card hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  details.type === type ? "border-gold-gradient bg-gold-gradient shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "border-outline-variant/50"
                )}>
                  {details.type === type && <div className="w-1.5 h-1.5 rounded-full bg-on-primary" />}
                </div>
                <span className={cn("text-sm transition-colors", details.type === type ? "text-gold-gradient font-bold" : "text-on-surface/60")}>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Design Style */}
        <div className="space-y-4 mb-8">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Design Style</label>
          <div className="flex flex-col gap-3">
            {DESIGN_STYLES.map(style => {
              const isSelected = details.designStyle.includes(style);
              return (
                <label 
                  key={style} 
                  onClick={() => handleDesignStyleToggle(style)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300",
                    isSelected ? "border-primary bg-primary/10" : "border-outline-variant/10 glass-card hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-sm border flex items-center justify-center transition-all",
                    isSelected ? "bg-gold-gradient border-gold-gradient" : "border-outline-variant/50 bg-surface-container/30"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-on-primary" strokeWidth={3} />}
                  </div>
                  <span className={cn("text-sm transition-colors", isSelected ? "text-gold-gradient font-bold" : "text-on-surface/60")}>{style}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Message on Cake */}
        <div className="space-y-2 mb-6">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Message on Cake (Optional)</label>
          <input 
            type="text" 
            maxLength={50}
            value={details.message}
            onChange={(e) => setDetails({...details, message: e.target.value})}
            className="w-full bg-surface-container/50 border border-outline-variant/20 text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface/20"
            placeholder="E.g. Happy Anniversary Alexander"
          />
          <p className="text-[10px] text-on-surface/30 italic">Max 50 characters</p>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2 mb-8">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Special Instructions (Optional)</label>
          <textarea 
            rows={3}
            placeholder="Allergies, sugar level preference, colors, dietary notes..."
            value={details.specialInstructions}
            onChange={(e) => setDetails({...details, specialInstructions: e.target.value})}
            className="w-full bg-surface-container/50 border border-outline-variant/20 text-on-surface text-sm rounded-lg p-3 placeholder:text-on-surface/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
          />
        </div>

        {/* Reference Photo */}
        <div className="space-y-2 mb-10">
          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Reference Photo (Optional)</label>
          <input 
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          {details.referencePhotoUrl ? (
            <div className="relative w-full h-48 rounded-xl border border-primary/30 overflow-hidden group">
              <img src={details.referencePhotoUrl} alt="Cake Reference" className="w-full h-full object-cover" />
              <button 
                onClick={() => setDetails({...details, referencePhotoUrl: ""})}
                className="absolute top-2 right-2 bg-background/80 hover:bg-error/80 p-2 rounded-full backdrop-blur-sm transition-all"
              >
                <X className="w-4 h-4 text-on-surface" />
              </button>
            </div>
          ) : (
            <button
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className="w-full border-2 border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all outline-none"
             >
               {isUploading ? (
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
               ) : (
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl grayscale-[0.5] group-hover:grayscale-0 transition-all">
                   📸
                 </div>
               )}
               <span className="font-label text-xs font-bold text-on-surface mt-2 text-center">
                 {isUploading ? "Uploading..." : "Click to upload reference"}
               </span>
               {!isUploading && <span className="text-[10px] text-on-surface/30">PNG, JPG up to 5MB</span>}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-outline-variant/10">
          <button 
            onClick={onBack}
            className="flex-1 py-4 border border-outline-variant/20 text-on-surface/60 font-label text-[10px] tracking-[0.2em] uppercase font-bold rounded-lg hover:text-on-surface hover:border-primary/40 transition-all"
          >
            Go Back
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase font-bold rounded-lg shadow-2xl shadow-primary/20 hover:scale-[1.05] transition-all"
          >
            Save Cake
          </button>
        </div>

      </div>
    </div>
  );
};
