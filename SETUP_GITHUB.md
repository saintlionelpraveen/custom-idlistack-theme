# Finish GitHub Setup

I have prepared your code and configured it for Codespaces. Since I cannot log in to your GitHub account, you need to run these final commands to push your code to the cloud.

### Option 1: If you have GitHub CLI (`gh`) installed (Recommended)
Run these commands in your terminal:

```bash
# 1. Login (if you haven't already/prompted)
gh auth login

# 2. Create the private repo and push
gh repo create sakthi-ghost --private --source=. --remote=origin --push
```

### Option 2: Manual Way
1.  Go to [github.com/new](https://github.com/new).
2.  Name it `sakthi-ghost`.
3.  Select **Private**.
4.  Click **Create repository**.
5.  Copy the URL (e.g., `https://github.com/YourName/sakthi-ghost.git`).
6.  Run these commands:
    ```bash
    git remote add origin <PASTE_YOUR_URL_HERE>
    git branch -M main
    git push -u origin main
    ```

## How to Launch Codespaces (Once Pushed)
1.  Go to your new repository page on GitHub.
2.  Click the green **Code** button.
3.  Click the **Codespaces** tab.
4.  Click **Create codespace on main**.

Your cloud computer will start, install Ghost, and you'll be ready to edit!
