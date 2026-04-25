"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/web/components/ui/button";
import { useRequiredCodePushAppName } from "@/web/hooks/use-codepush-route";

export default function ViewCollaborators() {
	const appName = useRequiredCodePushAppName();

	return (
		<>
			<Link href={`/codepush/${appName}/collaborators`}>
				<Button variant="outline" className="w-full sm:w-auto">
					<Users className="mr-2 h-4 w-4" />
					View Collaborators
				</Button>
			</Link>
		</>
	);
}
