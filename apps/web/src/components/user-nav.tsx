/**
 * User Navigation Dropdown
 * Renders the top-right avatar dropdown showing the signed-in user's
 * profile, quick links to `/users` and `/settings`, and a log-out action.
 *
 * @module UserNav
 *
 * Reads the current session via Better Auth's `useSession` hook. Until the
 * session resolves (or when unauthenticated), renders a skeleton so the
 * layout doesn't jump. Sign-out clears the Better Auth session cookie and
 * routes back to `/login`.
 */

"use client";

import { signOut, useSession } from "@rentlydev/rnota-auth/react";
import { LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/web/components/ui/avatar";
import { Button } from "@/web/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/web/components/ui/dropdown-menu";
import { Skeleton } from "@/web/components/ui/skeleton";
import { setUserLoggedOut } from "@/web/lib/cookie";

/**
 * UserNav component.
 *
 * @returns {JSX.Element} Avatar dropdown when signed in; a skeleton placeholder otherwise.
 *
 * @example
 * ```tsx
 * // apps/web/src/components/layout/header.tsx
 * <header>
 *   {/* ...nav links... *\/}
 *   <UserNav />
 * </header>
 * ```
 */
export function UserNav() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	/**
	 * Sign-out handler: sets the "user manually logged out" cookie flag
	 * (consumed by the GitHub button's auto-login guard), clears the
	 * Better Auth session, then navigates back to `/login`.
	 */
	const handleSignOut = async () => {
		setUserLoggedOut();
		await signOut();
		router.push("/login");
	};

	if (!isMounted || isPending) {
		return <Skeleton className="h-8 w-8 rounded-full" />;
	}

	if (session?.user) {
		const { image, name, email } = session.user;

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="relative h-8 w-8 rounded-full">
						<Avatar className="h-8 w-8">
							<AvatarImage src={image ?? ""} alt={name ?? ""} />
							<AvatarFallback>{name?.[0]}</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent className="w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">{name}</p>
							<p className="text-xs leading-none text-muted-foreground">{email}</p>
						</div>
					</DropdownMenuLabel>

					<DropdownMenuSeparator />

					<Link href="/users">
						<DropdownMenuItem>
							<Users size={16} />
							Users
						</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator />

					<Link href="/settings">
						<DropdownMenuItem>
							<Settings size={16} />
							Settings
						</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator />

					<DropdownMenuItem onClick={handleSignOut}>
						<LogOut size={16} />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return <Skeleton className="h-8 w-8 rounded-full" />;
}
