"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface NavSpinnerLinkProps {
    href: string;
    className?: string;
    children: React.ReactNode;
    external?: boolean;
}

/**
 * A drop-in replacement for <Link> that shows an inline spinner on click
 * to give instant visual feedback before a route change or new tab opens.
 */
export function NavSpinnerLink({ href, className, children, external }: NavSpinnerLinkProps) {
    const [spinning, setSpinning] = useState(false);

    const handleClick = () => {
        setSpinning(true);
        // Reset after 3s in case navigation is slow or external
        setTimeout(() => setSpinning(false), 3000);
    };

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                onClick={handleClick}
            >
                {spinning ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{children}</span>
                    </span>
                ) : children}
            </a>
        );
    }

    return (
        <Link href={href} className={className} onClick={handleClick}>
            {spinning ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{children}</span>
                </span>
            ) : children}
        </Link>
    );
}

/**
 * A plain button with an inline spinner on click.
 * Pass onClick — the spinner shows immediately while the handler runs.
 */
interface SpinnerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClickAsync?: () => void | Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export function SpinnerButton({ onClickAsync, onClick, children, className, ...rest }: SpinnerButtonProps) {
    const [spinning, setSpinning] = useState(false);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        setSpinning(true);
        try {
            if (onClickAsync) await onClickAsync();
            else if (onClick) onClick(e);
        } finally {
            setTimeout(() => setSpinning(false), 3000);
        }
    };

    return (
        <button className={className} onClick={handleClick} {...rest}>
            {spinning ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{children}</span>
                </span>
            ) : children}
        </button>
    );
}
