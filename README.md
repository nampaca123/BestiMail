BestiMail is a tool that helps you check the grammar of your email. It was developed to assist sales operators in their communication with customers.

There is a feature that corrects typos in real-time while the user is composing an email. The workflow is as follows:

1. When the user enters a typo, a WebSocket-enabled AI model detects it in real-time. The misspelled word is highlighted in red for 1 second on the browser.
2. The AI model corrects the typo, and the corrected word is highlighted in green for 2 seconds.
3. The "misspelled word - corrected word" pair is cached in Redis. If the user makes the same typo again, the backend algorithm automatically corrects it.

Additionally, when the user clicks the 'Overall Fix' button, the full email content is sent to the GPT-4o API, which refines the text for formal communication with consumers by adjusting expressions to be more professional and correcting any typos.

## Tech Stack

Flask (WebSocket)
SendGrid
Redis
OpenAI
React (Next.js, TailwindCSS)
Docker
Swagger UI

## AI Model
vennify/t5-base-grammar-correction ('https://huggingface.co/vennify/t5-base-grammar-correction')
OpenAI GPT 4o's API