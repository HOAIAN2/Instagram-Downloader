async function setDefaultDownloadUser(username = '') {
	try {
		if (!username) {
			DEFAULT_DOWNLOAD_USER.username = ''
			DEFAULT_DOWNLOAD_USER.id = ''
			DEFAULT_DOWNLOAD_USER.save()
			return
		}
		const userId = await getUserId(getAuthOptions(), username)
		if (userId) {
			DEFAULT_DOWNLOAD_USER.username = username
			DEFAULT_DOWNLOAD_USER.id = userId
			DEFAULT_DOWNLOAD_USER.save()
		}
	} catch (error) {
		console.log(error)
	}
}
function showExtensionConfig() {
	document.querySelector('.ext-config-container')?.remove()
	const isDarkMode = document.documentElement.classList.contains('_aa4d')
	const DISPLAY_CONTAINER =
		`<div class="ext-config-container ${isDarkMode ? 'dark' : ''}">
			<div class="title">
				<span>Config</span>
				<span class="esc">&times</span>
			</div>
			<form class="data-container">
				<div class="group-input">
					<label>Default download latest post from (username)</label>
					<input
						placeholder="Keep blank to get yourself"
						name="default_download_username"
						class="input-item"
						value="${DEFAULT_DOWNLOAD_USER.username}"/>
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
				if (!appState.currentDisplay) appState.setDefaultShortcode(DEFAULT_DOWNLOAD_USER.id)
			})
		saveButton.textContent = '.'
	})
	document.querySelector('span.esc').addEventListener('click', () => {
		container.remove()
	})
}