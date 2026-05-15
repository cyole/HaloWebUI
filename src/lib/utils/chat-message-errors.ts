const MISSING_OUTPUT_ERROR_TYPES = new Set(['empty_response', 'tool_no_output']);
const DEFAULT_PENDING_ASSISTANT_PLACEHOLDER_GRACE_SECONDS = 30 * 60;

export const hasVisibleMessageFiles = (files: unknown): boolean => {
	if (!Array.isArray(files)) {
		return false;
	}

	return files.some((file) => {
		if (!file || typeof file !== 'object') {
			return false;
		}

		const candidate = file as Record<string, unknown>;
		if (`${candidate.type ?? ''}`.trim().toLowerCase() !== 'image') {
			return false;
		}

		return ['url', 'id', 'name'].some((key) => `${candidate[key] ?? ''}`.trim() !== '');
	});
};

export const shouldHideMissingOutputError = (error: unknown, files: unknown): boolean => {
	if (!hasVisibleMessageFiles(files) || !error || typeof error !== 'object' || Array.isArray(error)) {
		return false;
	}

	const errorType = `${(error as Record<string, unknown>).type ?? ''}`.trim();
	return MISSING_OUTPUT_ERROR_TYPES.has(errorType);
};

export const getRenderableMessageError = (error: unknown, files: unknown) =>
	shouldHideMissingOutputError(error, files) ? null : error;

export const shouldKeepPendingAssistantPlaceholder = (
	message: unknown,
	nowSeconds = Date.now() / 1000,
	graceSeconds = DEFAULT_PENDING_ASSISTANT_PLACEHOLDER_GRACE_SECONDS
): boolean => {
	if (!message || typeof message !== 'object' || Array.isArray(message)) {
		return false;
	}

	const candidate = message as Record<string, unknown>;
	if (`${candidate.role ?? ''}`.trim().toLowerCase() !== 'assistant') {
		return false;
	}
	if (candidate.done === true || candidate.error) {
		return false;
	}
	if (`${candidate.content ?? ''}`.trim() !== '' || hasVisibleMessageFiles(candidate.files)) {
		return false;
	}

	const timestamp = Number(candidate.timestamp);
	if (!Number.isFinite(timestamp) || timestamp <= 0) {
		return true;
	}

	return nowSeconds - timestamp <= graceSeconds;
};
