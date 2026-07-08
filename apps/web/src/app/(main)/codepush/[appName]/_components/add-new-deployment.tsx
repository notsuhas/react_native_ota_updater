"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import LoadingSpinner from "@/web/components/loading-spinner";
import { Button } from "@/web/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/web/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/web/components/ui/form";
import { Input } from "@/web/components/ui/input";
import { useRequiredCodePushAppName } from "@/web/hooks/use-codepush-route";
import { useAddDeploymentMutation } from "@/web/lib/client/codepush-queries";

const formSchema = z.object({
	"deployment-name": z.string().min(2, { message: "Deployment name must be at least 2 characters" }),
});

type AddDeploymentFormValue = z.infer<typeof formSchema>;

export default function AddNewDeployment() {
	const appName = useRequiredCodePushAppName();

	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const form = useForm<AddDeploymentFormValue>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			"deployment-name": "",
		},
	});

	const onSuccessCallback = () => {
		setIsDialogOpen(false);
		form.reset();
	};

	const { mutate, isPending } = useAddDeploymentMutation(onSuccessCallback);

	const onSubmit = (data: AddDeploymentFormValue) => mutate({ deploymentName: data["deployment-name"] });

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary">New Deployment</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-[475px]">
				<DialogHeader>
					<DialogTitle>Create New Deployment</DialogTitle>
					<DialogDescription>Create a new Deployment for both platforms for {appName}.</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
						<FormField
							control={form.control}
							name="deployment-name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Deployment Name</FormLabel>
									<FormControl>
										<Input type="text" placeholder="My Deployment..." disabled={isPending} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="submit" className="ml-auto mt-4" disabled={isPending}>
								{isPending ? <LoadingSpinner /> : "Save"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
