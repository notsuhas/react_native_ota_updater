"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/web/components/ui/button";
import { Input } from "@/web/components/ui/input";

export function Endpoint() {
	const [isCopied, setIsCopied] = useState(false);

	const endpoint = "api/codepush/acquisition/";
	const endpointUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ""}${endpoint}`;

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(endpointUrl);
			setIsCopied(true);
			toast.info("Endpoint URL copied to clipboard");
			setTimeout(() => setIsCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
			toast.error("Failed to copy endpoint URL");
		}
	};

	return (
		<div className="flex w-full max-w-sm items-center space-x-2">
			<Input type="text" value={endpoint} readOnly className="font-mono text-xs" />
			<Button type="button" size="icon" onClick={copyToClipboard} variant={isCopied ? "outline" : "default"}>
				<Copy className="h-4 w-4" />
			</Button>
		</div>
	);
}
