# How to View Terminal Remotely (Using ttyd)

This guide explains how to share the terminal from your **second computer** so you can view and control it from your main computer (where you are currently working).

## 1. Install ttyd (On the Second Computer)

On the computer you want to **view** (the remote one), open a terminal and run:

### macOS (using Homebrew)
```bash
brew install ttyd
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install ttyd
```

## 2. Start the Shared Terminal

Still on the second computer, run this command to start sharing:

```bash
# Verify it works
ttyd -W bash
```

*   `-W`: Allows writing (controlling) the terminal. Remove it if you only want to *watch*.
*   `bash`: The shell to run (or `zsh` on Mac).

Ideally, run this for Mac (zsh):

```bash
ttyd -p 7681 -W zsh
```

## 3. Connect from this Computer

1.  Find the **IP Address** of the second computer.
    *   Mac: `ipconfig getifaddr en0` (or check Network Settings).
    *   Linux: `hostname -I`.
2.  On this computer, open Chrome/Browser.
3.  Go to: `http://<IP_OF_SECOND_COMPUTER>:7681`

Example: `http://192.168.1.15:7681`

## Security Warning ⚠️
Anyone on your Wi-Fi network can access this terminal if they know the IP and port. Only use this on a trusted home/office network.
