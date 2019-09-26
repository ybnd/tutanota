// @flow

type AutoLauncherModule = {
	isAutoLaunchEnabled: () => Promise<boolean>,
	enableAutoLaunch: () => Promise<void>,
	disableAutoLaunch: () => Promise<void>,
}
let platformAutoLauncher: Promise<AutoLauncherModule>
switch (process.platform) {
	case 'win32':
		platformAutoLauncher = import('./AutoLauncherWin32.js')
		break
	case 'darwin':
		platformAutoLauncher = import('./AutoLauncherDarwin.js')
		break
	case 'linux':
		platformAutoLauncher = import('./AutoLauncherLinux.js')
		break
	default:
		throw new Error('Invalid Platform')
}

export async function enableAutoLaunch() {
	const launcher = await platformAutoLauncher
	try {
		launcher.enableAutoLaunch()
	} catch (e) {
		console.log("could not enable auto launch:", e)
	}
}

export async function disableAutoLaunch() {
	const launcher = await platformAutoLauncher
	try {
		launcher.disableAutoLaunch()
	} catch (e) {
		console.log("could not disable auto launch:", e)
	}
}

export async function isAutoLaunchEnabled(): Promise<boolean> {
	const launcher = await platformAutoLauncher
	try {
		return await launcher.isAutoLaunchEnabled()
	} catch (e) {
		console.log("could not disable auto launch:", e)
		return false
	}
}
