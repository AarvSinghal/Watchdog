#  Watchdog — AI-Powered Website Monitoring

**Built by Team Spartans**

Watchdog is an AI-powered website monitoring platform designed to help users keep track of important changes across the web. Instead of repeatedly checking websites manually, users can create monitoring tasks, define conditions, and receive updates when something relevant happens.

The idea behind Watchdog is simple: users should be able to tell the system what they care about, while the system handles the repetitive work of checking websites and processing the results.

Watchdog combines **TinyFish for browser automation and web interaction** with AI-powered request understanding and relevance analysis. It is designed to be useful for tracking product prices, finding relevant opportunities, monitoring deadlines, and keeping up with changes on websites.

##  The Problem

Information on the internet changes constantly. Product prices fluctuate, job listings appear and disappear, application deadlines approach, and websites publish new information.

Checking each page manually takes time, and important updates can easily be missed. Traditional monitoring approaches can also become difficult to manage when users want to track different types of information using different conditions.

Watchdog addresses this problem by bringing website monitoring, customizable alert rules, and AI-assisted analysis into one workflow.

##  Key Features

### 1. Live Agent View

Watchdog is designed to make the monitoring process visible instead of hiding everything behind a loading screen.

Using TinyFish's **run-SSE streaming and Live Browser Preview**, the application can display the agent's browser activity and step-by-step progress while it works.

This helps users understand what the agent is doing, follow the website interaction, and see how information is being retrieved. It also makes the monitoring process easier to demonstrate and debug.

### 2. Natural-Language Watch Creation

Users should not need to configure complicated monitoring rules manually.

For example, a user could enter:

> "Tell me when this laptop drops below ₹60,000."

The AI interprets the request and helps convert it into a structured monitoring task containing the target website, the information to track, and the condition that matters.

TinyFish's Agent API is then used to perform the relevant website interaction. The application can use the interpreted request to configure the watch and its alert rule.

### 3. Smart Alert Rules

Not every change on a website deserves a notification. Watchdog uses configurable conditions to determine which observations matter to the user.

Examples include:

- Alert when a product price falls below a specified amount.
- Alert when a page title contains a particular keyword.
- Alert when a deadline is within the next seven days.

The application evaluates these conditions against the collected information. This rule-based approach helps reduce unnecessary notifications and gives users more control over what they monitor.

### 4. Notifications

Watchdog is designed to notify users when a monitored condition is met or a relevant change is detected.

Notifications can be connected to channels such as email, Telegram, or WhatsApp using application logic and supported webhooks.

The monitoring workflow and notification workflow are separate: the monitoring process collects and evaluates information, while the notification layer delivers the resulting alert.

### 5. Relevance Scoring

Finding information is useful, but finding information that fits a particular user is even more useful.

Watchdog can use a short user profile, such as skills, interests, location, or educational background, to evaluate how relevant collected opportunities are.

For example, a computer science student interested in Python opportunities in Delhi may want relevant internships ranked ahead of unrelated listings.

An AI model can analyze the collected results against the profile and produce relevance assessments. The goal is to help users prioritize opportunities rather than treating every result equally.

### 6. Monitoring Logged-In Websites

Some useful information is available only after signing in, such as college portals, private job boards, or account-specific pages.

TinyFish's **Browser Context Profiles and vault** can support browser sessions and credentials where the integration and website allow it.

This makes it possible to explore monitoring workflows beyond publicly accessible pages. Authentication-dependent websites can introduce additional security and reliability challenges, so credentials must be handled carefully and only authorized accounts should be used.

### 7. Deadline Calendar

Application deadlines are easy to overlook when they are scattered across different websites.

Watchdog is designed to extract relevant deadlines from sources such as internship and scholarship pages, organize the dates, and generate an `.ics` calendar file.

The file can then be imported into compatible calendar applications, including Google Calendar. This turns collected information into something users can use to plan their next steps.

##  How Watchdog Works

The overall workflow connects user input, browser automation, data processing, and notifications.

1. **User creates a watch:** The user enters a URL and describes the information or condition they care about.
2. **AI interprets the request:** Natural-language input is converted into a more structured monitoring task.
3. **TinyFish interacts with the website:** The agent navigates the page and retrieves relevant information. Its live browser and streaming capabilities can expose the steps performed.
4. **The application processes the results:** Extracted information is checked against the user's alert rules and monitoring requirements.
5. **Relevant results are evaluated:** AI-assisted relevance scoring can prioritize opportunities according to the user's profile.
6. **The system responds:** When an applicable condition is met, the notification workflow can deliver an alert. Collected deadlines can also be prepared for calendar export.

This separation is important: **TinyFish handles web interaction, while the application's own logic handles rule evaluation, notification delivery, and calendar generation.** AI helps interpret requests and assess relevance.

##  Technology and Architecture

| Technology | Purpose |
|---|---|
| TinyFish Agent API | Website navigation and information retrieval |
| TinyFish run-SSE | Streaming agent progress and browser activity |
| TinyFish Live Browser Preview | Visual view of the agent's work |
| Browser Context Profiles and vault | Support for authenticated browser sessions |
| AI model | Interpret natural-language requests and assess relevance |
| Application logic | Watch configuration, alert rules, notifications, and `.ics` generation |
| Webhooks | Connect supported notification channels |

The architecture keeps website interaction separate from the logic that decides what to do with the collected information. This makes individual parts easier to test and improve.

## 🚀 Getting Started

### Prerequisites

- Git
- Node.js and npm, if the project uses a Node.js setup
- Required API credentials for the AI and TinyFish integrations

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/watchdog-ai-monitor.git
cd watchdog-ai-monitor
```

Install dependencies:

```bash
npm install
```

Create a `.env` file containing the environment variables required by your implementation. Use the actual variable names referenced in your code, and never commit real credentials.

Start the development server using the script configured in your project:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

*Note: These commands assume the repository uses npm and defines a `dev` script. Follow the project's actual configuration if it differs.*

## 🔐 Security and Responsible Use

- Keep API keys and credentials out of source control.
- Store sensitive configuration in environment variables or a suitable secret manager.
- Use authenticated monitoring only for accounts and websites you are authorized to access.
- Respect website policies, applicable laws, and reasonable request limits.
- Handle failed requests and incomplete extraction without treating them as confirmed results.

##  Future Improvements

Potential improvements include more reliable scheduling, richer monitoring history, customizable notification preferences, improved handling of dynamic websites, and clearer explanations of why an alert was triggered.

These improvements can help make Watchdog more reliable as the number of monitored websites and users grows.

##  Team

**Team Spartans**

We built Watchdog around a practical goal: reducing the effort required to keep track of changing information online. By combining browser automation, user-defined rules, and AI-assisted analysis, we aim to make monitoring more useful and easier to understand.

##  Acknowledgements

- [TinyFish](https://www.tinyfish.ai/) — browser automation and web interaction capabilities.
- [Google AI for Developers](https://ai.google.dev/) — Gemini documentation and AI development resources

---

**Watchdog — Monitor what matters, without checking every page yourself.**
