# Proactive Browser Copilot

This is a Chrome extension that helps users by providing proactive suggestions based on their browsing history.

## Setup

1. **Load the extension into Chrome**
- Open Chrome and navigate to `chrome://extensions`.
- Enable Developer mode by clicking the toggle switch in the top right corner.
- Click the `Load unpacked` button and select the project directory.

Now, the Proactive Browser Copilot extension should be loaded into your Chrome browser and ready to use.

2. **Clone the repository**

   Use the following command to clone this repository:

```shell
git clone https://github.com/astelmach01/personal-kristian.git
```

3. **Install dependencies**

Navigate to the project directory and install the necessary dependencies with:

```shell
cd personal kristian
npm install
```


4. **Set up environment variables**

Create a `.env` file in the root directory of the project and add the following variables:

```
OPENAI_API_KEY=your_openai_api_key OPENAI_ORGANIZATION=your_openai_organization EXTENSION_ID=your_chrome_extension_id
```


Replace `your_openai_api_key`, `your_openai_organization`, and `your_chrome_extension_id` with your actual OpenAI API key, OpenAI organization, and Chrome extension ID respectively.

Your chrome extension id is found on the details page of the custom extension.

5. **Start the server**

You can start the server by running:

```shell
npm run dev
```


## Usage

Click on the extension icon in the Chrome toolbar when you visit a page.