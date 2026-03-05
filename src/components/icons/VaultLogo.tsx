export function VaultLogo(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Outer Rounded Square Box */}
            <rect x="10" y="10" width="100" height="100" rx="24" stroke="currentColor" strokeWidth="5" />

            {/* The 8 Spokes with Rounded T-Bars */}
            <g stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                {/* Top */}
                <path d="M60 38 L60 18 M54 18 L66 18" />
                {/* Bottom */}
                <path d="M60 82 L60 102 M54 102 L66 102" />
                {/* Left */}
                <path d="M38 60 L18 60 M18 54 L18 66" />
                {/* Right */}
                <path d="M82 60 L102 60 M102 54 L102 66" />

                {/* Top-Right (45 deg) */}
                <path d="M75.5 44.5 L89.7 30.3 M86.2 26.8 L93.2 33.8" />
                {/* Bottom-Right (135 deg) */}
                <path d="M75.5 75.5 L89.7 89.7 M93.2 86.2 L86.2 93.2" />
                {/* Bottom-Left (225 deg) */}
                <path d="M44.5 75.5 L30.3 89.7 M33.8 93.2 L26.8 86.2" />
                {/* Top-Left (315 deg) */}
                <path d="M44.5 44.5 L30.3 30.3 M26.8 33.8 L33.8 26.8" />
            </g>

            {/* Center Hub Outer Ring */}
            <circle cx="60" cy="60" r="22" stroke="currentColor" strokeWidth="5" />

            {/* Center Hub Inner Ring */}
            <circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="5" />

            {/* Absolute Center Dot */}
            <circle cx="60" cy="60" r="3.5" fill="currentColor" />

            {/* 8 Rivets on the Hub Ring */}
            <g fill="currentColor">
                <circle cx="60" cy="44" r="1.5" />
                <circle cx="60" cy="76" r="1.5" />
                <circle cx="44" cy="60" r="1.5" />
                <circle cx="76" cy="60" r="1.5" />

                <circle cx="71.3" cy="48.7" r="1.5" />
                <circle cx="71.3" cy="71.3" r="1.5" />
                <circle cx="48.7" cy="71.3" r="1.5" />
                <circle cx="48.7" cy="48.7" r="1.5" />
            </g>
        </svg>
    );
}
