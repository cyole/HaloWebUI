<script>
	import { toast } from 'svelte-sonner';
	import { getContext, onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';

	import { getBackendConfig } from '$lib/apis';
	import { userSignIn } from '$lib/apis/auths';
	import { WEBUI_BASE_URL } from '$lib/constants';
	import { WEBUI_NAME, config, socket, user } from '$lib/stores';
	import { localizeCommonError } from '$lib/utils/common-errors';

	const i18n = getContext('i18n');

	let loaded = false;
	let email = '';
	let password = '';

	const formatError = (error) =>
		localizeCommonError(error, (key, options) => $i18n.t(key, options));

	const querystringValue = (key) => {
		const querystring = window.location.search;
		const urlParams = new URLSearchParams(querystring);
		return urlParams.get(key);
	};

	const setSessionUser = async (sessionUser) => {
		if (sessionUser) {
			toast.success($i18n.t(`You're now logged in.`));
			if (sessionUser.token) {
				localStorage.token = sessionUser.token;
			}

			$socket.emit('user-join', { auth: { token: sessionUser.token } });
			await user.set(sessionUser);
			await config.set(await getBackendConfig());

			const redirectPath = querystringValue('redirect') || '/';
			goto(redirectPath);
		}
	};

	const signInHandler = async () => {
		const sessionUser = await userSignIn(email, password).catch((error) => {
			toast.error(formatError(error));
			return null;
		});

		await setSessionUser(sessionUser);
	};

	async function setLogoImage() {
		await tick();
		const logo = document.getElementById('logo');

		if (logo) {
			const isDarkMode = document.documentElement.classList.contains('dark');

			if (isDarkMode) {
				const darkImage = new Image();
				darkImage.src = '/static/favicon-dark.png';

				darkImage.onload = () => {
					logo.src = '/static/favicon-dark.png';
					logo.style.filter = '';
				};

				darkImage.onerror = () => {
					logo.style.filter = 'invert(1)';
				};
			}
		}
	}

	onMount(async () => {
		if ($user !== undefined) {
			const redirectPath = querystringValue('redirect') || '/';
			goto(redirectPath);
		}

		loaded = true;
		setLogoImage();
	});
</script>

<svelte:head>
	<title>
		{`${$WEBUI_NAME}`}
	</title>
</svelte:head>

<div class="w-full h-screen max-h-[100dvh] text-white relative">
	<div class="w-full h-full absolute top-0 left-0 bg-white dark:bg-black"></div>

	<div class="w-full absolute top-0 left-0 right-0 h-8 drag-region" />

	{#if loaded}
		<div class="fixed m-10 z-50">
			<div class="flex space-x-2">
				<div class="self-center">
					<img
						id="logo"
						crossorigin="anonymous"
						src="{WEBUI_BASE_URL}/static/splash.png"
						class="w-6 rounded-full"
						alt="logo"
					/>
				</div>
			</div>
		</div>

		<div
			class="fixed bg-transparent min-h-screen w-full flex justify-center font-primary z-50 text-black dark:text-white"
		>
			<div class="w-full sm:max-w-md px-10 min-h-screen flex flex-col text-center">
				<div class="my-auto pb-10 w-full dark:text-gray-100">
					<form
						class="flex flex-col justify-center"
						on:submit={(e) => {
							e.preventDefault();
							signInHandler();
						}}
					>
						<div class="mb-1">
							<div class="text-2xl font-medium">
								{$i18n.t(`Admin Sign in to {{WEBUI_NAME}}`, { WEBUI_NAME: $WEBUI_NAME })}
							</div>
						</div>

						<div class="flex flex-col mt-4">
							<div class="mb-2">
								<div class="text-sm font-medium text-left mb-1">{$i18n.t('Email')}</div>
								<input
									bind:value={email}
									type="email"
									class="my-0.5 w-full text-sm outline-hidden bg-transparent"
									autocomplete="email"
									name="email"
									placeholder={$i18n.t('Enter Your Email')}
									required
								/>
							</div>

							<div>
								<div class="text-sm font-medium text-left mb-1">{$i18n.t('Password')}</div>

								<input
									bind:value={password}
									type="password"
									class="my-0.5 w-full text-sm outline-hidden bg-transparent"
									placeholder={$i18n.t('Enter Your Password')}
									autocomplete="current-password"
									name="current-password"
									required
								/>
							</div>
						</div>

						<div class="mt-5">
							<button
								class="bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition w-full rounded-full font-medium text-sm py-2.5"
								type="submit"
							>
								{$i18n.t('Sign in')}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
