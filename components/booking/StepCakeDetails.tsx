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
      
      <div className="bg-surface-container-lowest border border-primary/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Top embellishment */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container via-primary to-primary-container" />
        
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎂</span>
          <h2 className="font-headline italic text-2xl text-on-surface">Custom Celebration Cake Details</h2>
        </div>
        <p className="font-body text-secondary text-xs mb-8">Select your cake size and customize the design</p>

        {/* Cake Size */}
        <div className="space-y-2 mb-6">
          <label className="font-label text-xs font-bold text-on-surface">Cake Size *</label>
          <select 
            value={details.size}
            onChange={handleSizeChange}
            className="w-full bg-surface-container border border-primary text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Select a size...</option>
            {SIZES.map(s => (
              <option key={s.value} value={s.value}>{s.label} (Price: ${s.price})</option>
            ))}
          </select>
        </div>

        {/* Retail Price Display */}
        <div className="mb-6 bg-surface-container-low border-l-4 border-primary rounded-r-lg p-4 flex justify-between items-center transition-all duration-300">
          <span className="font-label text-xs font-bold text-secondary">Retail Price:</span>
          <span className="font-headline italic text-xl text-primary">
            {details.retailPrice ? `$${details.retailPrice}.00` : "--"}
          </span>
        </div>

        {/* Cake Flavor */}
        <div className="space-y-2 mb-6">
          <label className="font-label text-xs font-bold text-on-surface">Cake Flavor *</label>
          <select 
            value={details.flavor}
            onChange={(e) => setDetails({...details, flavor: e.target.value})}
            className="w-full bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Select a flavor...</option>
            {FLAVORS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Cake Type */}
        <div className="space-y-4 mb-8">
          <label className="font-label text-xs font-bold text-on-surface">Cake Type</label>
          <div className="flex flex-col gap-3">
            {[ "With Egg", "Eggless" ].map(type => (
              <label 
                key={type} 
                onClick={() => setDetails(prev => ({ ...prev, type }))}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300",
                  details.type === type ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  details.type === type ? "border-primary" : "border-outline-variant/50"
                )}>
                  {details.type === type && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className={cn("text-sm transition-colors", details.type === type ? "text-primary font-bold" : "text-secondary")}>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Design Style */}
        <div className="space-y-4 mb-8">
          <label className="font-label text-xs font-bold text-on-surface">Design Style</label>
          <div className="flex flex-col gap-3">
            {DESIGN_STYLES.map(style => {
              const isSelected = details.designStyle.includes(style);
              return (
                <label 
                  key={style} 
                  onClick={() => handleDesignStyleToggle(style)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300",
                    isSelected ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-sm border flex items-center justify-center transition-all",
                    isSelected ? "bg-primary border-primary" : "border-outline-variant/50 bg-surface-container"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-on-primary" strokeWidth={3} />}
                  </div>
                  <span className={cn("text-sm transition-colors", isSelected ? "text-primary font-bold" : "text-secondary")}>{style}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Message on Cake */}
        <div className="space-y-2 mb-6">
          <label className="font-label text-xs font-bold text-on-surface">Message on Cake (Optional)</label>
          <input 
            type="text" 
            maxLength={50}
            value={details.message}
            onChange={(e) => setDetails({...details, message: e.target.value})}
            className="w-full bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <p className="text-[10px] text-secondary">Max 50 characters</p>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2 mb-8">
          <label className="font-label text-xs font-bold text-on-surface">Special Instructions (Optional)</label>
          <textarea 
            rows={3}
            placeholder="Allergies, sugar level preference, colors, dietary notes..."
            value={details.specialInstructions}
            onChange={(e) => setDetails({...details, specialInstructions: e.target.value})}
            className="w-full bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded-lg p-3 placeholder:text-outline-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
          />
        </div>

        {/* Reference Photo */}
        <div className="space-y-2 mb-10">
          <label className="font-label text-xs font-bold text-on-surface">Reference Photo (Optional)</label>
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
                className="absolute top-2 right-2 bg-background/80 hover:bg-background p-2 rounded-full backdrop-blur-sm transition-all"
              >
                <X className="w-4 h-4 text-on-surface" />
              </button>
            </div>
          ) : (
            <button
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className="w-full border-2 border-dashed border-primary/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all outline-none"
             >
               {isUploading ? (
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
               ) : (
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">
                   📸
                 </div>
               )}
               <span className="font-label text-xs font-bold text-on-surface mt-2 text-center">
                 {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
               </span>
               {!isUploading && <span className="text-[10px] text-secondary">PNG, JPG up to 5MB</span>}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-outline-variant/20">
          <button 
            onClick={onBack}
            className="flex-1 py-4 border border-outline-variant/30 text-secondary font-label text-[10px] tracking-[0.2em] uppercase font-bold rounded-lg hover:text-on-surface hover:border-outline-variant/60 transition-all"
          >
            Go Back
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            Save Cake
          </button>
        </div>

      </div>
    </div>
  );
};
