"use client";

import { useEffect } from "react";
import { lockAdminTerminalAction } from "@/app/actions/admin-auth";

export function AdminRouteWatcher() {

    useEffect(() => {
        // We set up a strict effect. 
        // If this component unmounts (because the user navigated away from the layout),
        // we fire the server action to destroy the cookie.
        
        return () => {
            // Only fire if we are actually leaving the admin section.
            // If we're just navigating between admin subpages, we shouldn't lock it.
            // However, currently mac-sam-0005 is a single page.
            
            // We use navigator.sendBeacon or a detached fetch for reliable unmount execution
            // But since this is a Next.js client transition most of the time,
            // calling the server action directly often works.
            
            lockAdminTerminalAction().catch(console.error);
        };
    }, []);

    // We also want to listen to beforeunload to catch tab closes/refreshes
    useEffect(() => {
        const handleBeforeUnload = () => {
            lockAdminTerminalAction().catch(console.error);
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return null; // This is a logic-only component
}
