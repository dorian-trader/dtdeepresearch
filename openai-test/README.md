# OpenAI API Key Test

This folder contains a simple test script to verify that your OpenAI API key can be read from the root-level `.env` file and that you can successfully make API calls.

## Setup

1. Make sure you have a `.env` file in the root directory of this project with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Test

```bash
npm test
```
