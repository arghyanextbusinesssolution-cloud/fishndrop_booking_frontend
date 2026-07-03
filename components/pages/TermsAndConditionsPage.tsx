"use client";

import Link from "next/link";

export default function TermsAndConditionsPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] text-center">
                Terms & Conditions
            </h1>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none text-[var(--text-secondary)]">
                <p>
                    {/* Replace this placeholder with the actual terms and conditions content. */}
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.
                    Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed,
                    dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a,
                    semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie,
                    enim est eleifend mi, non fermentum diam nisl sit amet erat.
                </p>
                <p>
                    Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus.
                    Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl
                    felis, venenatis tristique, dignissim in, ultrices sit amet, augue.
                </p>
                <p>
                    By proceeding with a booking you agree to these terms. If you have any
                    questions, please contact support.
                </p>
            </div>
            <div className="flex flex-col items-start space-y-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="agreeTerms"
                        className="h-4 w-4 text-[#E5C77A] border-gray-300 rounded"
                        // Using simple inline handler; in a real app, use state management
                        onChange={(e) => {
                            const btn = document.getElementById('proceedBtn') as HTMLButtonElement;
                            if (btn) btn.disabled = !e.target.checked;
                        }}
                    />
                    <label htmlFor="agreeTerms" className="text-sm text-[var(--text-primary)]">
                        I agree to the terms and conditions
                    </label>
                </div>
                <button
                    id="proceedBtn"
                    disabled
                    onClick={() => {
                        // Navigate to bookings page after agreement
                        const router = (window as any).router;
                        if (router && typeof router.push === 'function') {
                            router.push('/user/bookings');
                        } else {
                            window.location.href = '/user/bookings';
                        }
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-[#E5C77A] px-6 py-3 text-base font-bold text-[#0F2D23] shadow-lg transition-all hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Proceed
                </button>
            </div>
        </div>
    );
}
