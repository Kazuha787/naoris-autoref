const { logMessage } = require("../utils/logger");
const { Wallet } = require("ethers");
const CryptoJS = require("crypto-js");
const { connect } = require("puppeteer-real-browser");

class naorisProtocol {
  constructor(refCode, proxy = null, currentNum, total) {
    this.refCode = refCode;
    this.proxy = proxy ? this.parseProxy(proxy) : null;
    this.currentNum = currentNum;
    this.total = total;
    this.aeskey = "X7KKHhJ67hE9ITXoGa89r74hMEPgysMwbuRRiJKFCIfxdKT9G8";
    this.wallet = Wallet.createRandom();
  }

  getWallet() {
    return this.wallet;
  }

  parseProxy(proxyString) {
    if (!proxyString) return null;
    try {
      const url = new URL(proxyString);
      return {
        host: url.hostname,
        port: parseInt(url.port),
        username: url.username || null,
        password: url.password || null,
      };
    } catch (error) {
      console.error("Invalid proxy format:", error);
      return {};
    }
  }

  async createEncryptedWallet() {
    const encryptedAddress = CryptoJS.AES.encrypt(
      JSON.stringify(this.wallet.address),
      this.aeskey
    ).toString();
    return encryptedAddress;
  }

  async registerWallet(encryptedWallet) {
    logMessage(this.currentNum, this.total, "Registering wallet", "process");
    const url = "https://naorisprotocol.network/sec-api/api/create-wallet";
    const { browser, page } = await connect({
      headless: true,
      turnstile: true,
      args: [],
      customConfig: {},
      disableXvfb: false,
      ignoreAllFlags: false,
      ...(this.proxy ? { proxy: this.proxy } : {}),
    });

    try {
      await page.setExtraHTTPHeaders({
        origin: "chrome-extension://dbgibbbeebmbmmhmebogidfbfehejgfo",
        Accept: "application/json, text/plain, */*",
        Connection: "keep-alive",
      });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      );

      await page.goto(url, { waitUntil: "networkidle2" });
      const response = await page.evaluate(
        async (url, loginData) => {
          const fetchResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(loginData),
          });
          return fetchResponse.json();
        },
        url,
        { wallet_address: encryptedWallet, referrer_code: this.refCode }
      );

      return response;
    } catch (error) {
      return null;
    } finally {
      await browser.close();
    }
  }

  async getToken() {
    logMessage(this.currentNum, this.total, "Trying get token", "process");
    const url = "https://naorisprotocol.network/claim-api/auth/generateToken";
    const { browser, page } = await connect({
      headless: true,
      turnstile: true,
      args: [],
      customConfig: {},
      disableXvfb: false,
      ignoreAllFlags: false,
      ...(this.proxy ? { proxy: this.proxy } : {}),
    });

    try {
      await page.setExtraHTTPHeaders({
        origin: "chrome-extension://dbgibbbeebmbmmhmebogidfbfehejgfo",
        Accept: "application/json, text/plain, */*",
        Connection: "keep-alive",
      });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      );

      await page.goto(url, { waitUntil: "networkidle2" });
      const response = await page.evaluate(
        async (url, loginData) => {
          const fetchResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(loginData),
          });
          return fetchResponse.json();
        },
        url,
        { wallet_address: this.wallet.address }
      );

      return response.token;
    } catch (error) {
      return null;
    } finally {
      await browser.close();
    }
  }
}

module.exports = naorisProtocol;
