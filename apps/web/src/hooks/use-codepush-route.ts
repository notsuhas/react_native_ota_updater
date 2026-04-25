"use client";

import { useParams } from "next/navigation";

export type PlatformName = "ios" | "android";

function decodeParam(param: string | string[] | undefined): string | null {
	if (typeof param !== "string") return null;
	return decodeURIComponent(param);
}

export function useCodePushRouteParams() {
	const params = useParams();

	const appName = decodeParam(params.appName);
	const platformName = decodeParam(params.platformName) as PlatformName | null;

	return { appName, platformName };
}

export function useRequiredCodePushAppName() {
	const { appName } = useCodePushRouteParams();
	if (appName === null) throw new Error("Missing appName in route params");
	return appName;
}

export function useRequiredCodePushPlatformName(): PlatformName {
	const { platformName } = useCodePushRouteParams();
	if (platformName === null) throw new Error("Missing platformName in route params");
	return platformName;
}

export function useRequiredCodePushPlatformRoute() {
	return {
		appName: useRequiredCodePushAppName(),
		platformName: useRequiredCodePushPlatformName(),
	};
}
