import { getSessionFromHeaders } from "@rentlydev/rnota-auth/session";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import TokenDisplay from "@/web/components/token-display";
import TokenDisplayError from "@/web/components/token-display/error";
import TokenDisplayLoading from "@/web/components/token-display/loading";
import { generateCliTokenQueryOptions } from "@/web/lib/client/common-queries";
import { PAGES } from "@/web/lib/constants";
import { getQueryClient } from "@/web/lib/query-client";

interface CliLoginPageProps {
	searchParams: Promise<{ hostname: string | undefined }>;
}

export default async function CliLoginPage({ searchParams }: CliLoginPageProps) {
	// Backstop: this page mints a CLI access key, so don't let proxy.ts be the only gate.
	const session = await getSessionFromHeaders(await headers());
	if (!session) redirect(PAGES.LOGIN);

	const queryClient = getQueryClient();
	const { hostname } = await searchParams;

	if (!hostname) {
		return <TokenDisplayError />;
	}

	void queryClient.prefetchQuery(generateCliTokenQueryOptions({ hostname }));

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Suspense fallback={<TokenDisplayLoading />}>
				<TokenDisplay hostname={hostname} />
			</Suspense>
		</HydrationBoundary>
	);
}
