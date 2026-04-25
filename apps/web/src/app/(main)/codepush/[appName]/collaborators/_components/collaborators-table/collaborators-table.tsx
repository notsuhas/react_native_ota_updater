"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/web/components/ui/table";
import { useRequiredCodePushAppName } from "@/web/hooks/use-codepush-route";
import { getCollaboratorsQueryOptions } from "@/web/lib/client/codepush-queries";
import { CollaboratorRow } from "./collaborator-row";

export function CollaboratorsTable() {
	const appName = useRequiredCodePushAppName();

	const { data: collaborators } = useSuspenseQuery(getCollaboratorsQueryOptions({ appName }));

	if (!collaborators?.length) {
		return (
			<div className="text-center p-12">
				<p className="text-lg text-muted-foreground">No collaborators available for this app.</p>
			</div>
		);
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Permission</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{collaborators.map((collaborator) => (
						<CollaboratorRow key={collaborator.userId} collaborator={collaborator} appName={appName} />
					))}
				</TableBody>
			</Table>
		</>
	);
}
