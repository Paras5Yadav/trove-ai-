import { notFound } from "next/navigation";

/**
 * Honeypot page — bots and scanners probing /admin will get a standard 404.
 * The real admin panel lives at /mac-sam-0005.
 */
export default function AdminHoneypot() {
    notFound();
}
