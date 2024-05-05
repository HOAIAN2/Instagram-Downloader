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
function showDefaultDownloadUser() {
	const defaultDownloadUser = JSON.parse(localStorage.getItem('_default_download_user'))
	const DISPLAY_CONTAINER =
		`<div class="default-download-user-container">
			<div class="data-container">
				<span class="esc">&times</span>
				<input value="${defaultDownloadUser.username}"/>
				<button>Save</button>
			</div>
		</div>`
	const DISPLAY_NODE = new DOMParser().parseFromString(DISPLAY_CONTAINER, 'text/html').body
	DISPLAY_NODE.childNodes.forEach(node => { document.body.appendChild(node) })

	const container = document.querySelector('.default-download-user-container')
	container.addEventListener('click', e => {
		if (e.target.classList.contains('esc')) container.remove()
		if (e.target.nodeName === 'BUTTON') {
			const username = document.querySelector('.data-container>input').value
			const saveButton = document.querySelector('.data-container>button')
			const interval = setInterval(() => {
				if (saveButton.textContent.length <= 3) saveButton.textContent += '.'
			}, 200)
			setDefaultDownloadUser(username)
				.then(() => {
					saveButton.textContent = 'Saved'
					clearInterval(interval)
				})
			saveButton.textContent = '.'
		}
	})
}