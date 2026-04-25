"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useRequiredCodePushAppName } from "@/web/hooks/use-codepush-route";
import { getAppQueryOptions } from "@/web/lib/client/codepush-queries";

export default function AppHeader() {
	const appName = useRequiredCodePushAppName();
	const { data: app } = useSuspenseQuery(getAppQueryOptions({ appName }));

	if (!app) {
		return null;
	}

	return (
		<div className="flex items-center gap-4">
			<img src={app.iconUrl ?? ""} alt={`${app.name} icon`} className="h-16 w-16 rounded" />

			<h1 className="text-3xl font-bold">{app.name}</h1>
		</div>
	);
}
