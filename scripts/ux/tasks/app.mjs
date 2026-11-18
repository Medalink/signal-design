// Goals inside the example apps. A message's action bar shows on hover with a mouse; a finger
// reaches the same actions by holding the message's text, which opens its menu.

const MESSAGE = '.chat-feed .sd-message >> nth=-2'
const REPLY_TEXT = 'Hello from the ux scorecard'

export const APP_TASKS = [
  {
    id: 'app.chat.reply',
    title: 'Reply to a message and send it',
    start: 'chat.html',
    steps: [
      { hover: MESSAGE, only: 'desktop' },
      { click: `${MESSAGE} >> .sd-message-actions button[aria-label="Reply"]`, only: 'desktop' },
      { longPress: `${MESSAGE} >> .sd-message-text`, only: 'phone' },
      { click: '#msg-menu [data-menu="reply"]', only: 'phone' },
      { type: REPLY_TEXT },
      { key: 'Enter' },
    ],
    done: () => [...document.querySelectorAll('.chat-feed .sd-message[data-own][data-reply]')].some(message => message.textContent.includes('Hello from the ux scorecard')),
  },
  {
    id: 'app.chat.react',
    title: 'Add a reaction to a message',
    start: 'chat.html',
    steps: [
      { hover: MESSAGE, only: 'desktop' },
      { click: `${MESSAGE} >> .sd-message-actions button[aria-label="React \u{1F44D}"]`, only: 'desktop' },
      { longPress: `${MESSAGE} >> .sd-message-text`, only: 'phone' },
      { click: '#msg-menu [data-menu="react"]', only: 'phone' },
      { click: '#emoji button[data-emoji], #emoji .sd-emoji-grid button', only: 'phone' },
    ],
    done: () => Boolean(document.querySelectorAll('.chat-feed .sd-message')[document.querySelectorAll('.chat-feed .sd-message').length - 2]?.querySelector('.sd-reactions')),
  },
  {
    id: 'app.chat.thread',
    title: 'Open a thread on a message',
    start: 'chat.html',
    skip: 'chat.html has no threads; the thread parts are shown on lib-messages.html without a conversation to open them from',
    steps: [],
    done: () => false,
  },
  {
    id: 'app.shell.expand-row',
    title: 'Open a container row to see its details',
    start: 'shell.html',
    steps: [{ click: '[data-sd-toggle^="detail-"]' }],
    done: () => {
      const toggle = document.querySelector('[data-sd-toggle^="detail-"]')
      const detail = document.getElementById(toggle.getAttribute('aria-controls'))
      return toggle.getAttribute('aria-expanded') === 'true' && Boolean(detail?.getClientRects().length)
    },
  },
  {
    id: 'app.form.submit-invalid',
    title: 'Submit the add-server form empty and reach the first error',
    start: 'form.html',
    steps: [
      { click: '#srv-address' },
      { key: 'Enter' },
    ],
    done: () => {
      const field = document.getElementById('srv-address')
      const error = document.getElementById('srv-address-error')
      return field.getAttribute('aria-invalid') === 'true' && document.activeElement === field && Boolean(error?.getClientRects().length)
    },
  },
]
