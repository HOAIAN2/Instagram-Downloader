async function setDefaultDownloadUser(username = '') {
	try {
		const userId = await getUserId(getAuthOptions(), username)
		if (userId) {
			const data = {
				username: username,
				id: userId
			}
			localStorage.setItem('_default_download_user', JSON.stringify(data))
		}
	} catch (error) {
		console.log(error)
	}
}
function showExtensionConfig() {
	const defaultDownloadUser = JSON.parse(localStorage.getItem('_default_download_user'))
	const DISPLAY_CONTAINER =
		`<div class="ext-config-container">
			<div class="title">
				<span>Config</span>
				<span class="esc">&times</span>
			</div>
			<form class="data-container">
				<div class="group-input">
					<label>Default download latest post from (username)</label>
					<input name="default_download_username" class="input-item" value="${defaultDownloadUser.username}"/>
				</div>
				<button class="save-button">Save</button>
			</form>
		</div>`
	const DISPLAY_NODE = new DOMParser().parseFromString(DISPLAY_CONTAINER, 'text/html').body
	DISPLAY_NODE.childNodes.forEach(node => { document.body.appendChild(node) })

	const container = document.querySelector('.ext-config-container')
	document.querySelector('form.data-container').addEventListener('submit', e => {
		e.preventDefault()
		const saveButton = document.querySelector('button.save-button')
		const formData = new FormData(e.target)
		const interval = setInterval(() => {
			if (saveButton.textContent.length <= 3) saveButton.textContent += '.'
			else saveButton.textContent = '.'
		}, 200)
		setDefaultDownloadUser(formData.get('default_download_username'))
			.then(() => {
				saveButton.textContent = 'Saved'
				clearInterval(interval)
				const defaultDownloadUser = JSON.parse(localStorage.getItem('_default_download_user'))
				if (!appState.currentDisplay) appState.setDefaultShortcode(defaultDownloadUser.id)
			})
		saveButton.textContent = '.'
	})
	document.querySelector('span.esc').addEventListener('click', () => {
		container.remove()
	})
}