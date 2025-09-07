---
title: "VaR, Two Ways: Parametric vs Historical"
pubDate: 2025-08-07
modDate: 2025-08-07
categories: ["finance", "risk", "quant", "experiments"]
description: "Two common ways to estimate how much you might lose in a portfolio — and what they each get wrong."
slug: var-two-ways
draft: false
pin: false
---

# VaR, Two Ways: Parametric vs Historical

One of the most useful—and misunderstood—metrics in finance is **Value at Risk**. At first glance it feels like a joke: “95% of the time, you’ll lose less than X.” What about the other 5%? Shrug. But as a system for comparing risk across assets, time periods, or portfolios, it’s surprisingly powerful.

And simple to compute.

Until you realize there are *five different ways* to compute it.

---

### What is VaR, in English?

Value at Risk tells you, **given some time horizon and confidence level**, what your *worst-case* loss might be.

> “With 99% confidence, you won’t lose more than ₹X over the next 1 day.”

The key word there is **confidence**. Not guarantee.

---

### Method 1: Parametric (Gaussian) VaR

This one assumes that returns are normally distributed. That lets you calculate VaR with a single formula:

$$
\text{VaR}_\alpha = \mu + z_\alpha \cdot \sigma
$$

* $\mu$: expected return
* $\sigma$: standard deviation (you can plug in EWMA volatility here!)
* $z_\alpha$: inverse CDF of the standard normal (e.g. -2.33 for 99%)

#### Quick code demo:

```python
import numpy as np
from scipy.stats import norm

def parametric_var(returns, alpha=0.99):
    mu = np.mean(returns)
    sigma = np.std(returns)
    z = norm.ppf(1 - alpha)
    return -(mu + z * sigma)
```

It’s fast, explainable, and works… as long as your returns aren’t fat-tailed, skewed, or weird (spoiler: they usually are).

---

### Method 2: Historical Simulation

Forget assumptions. Just sort your historical returns and grab the quantile.

```python
def historical_var(returns, alpha=0.99):
    return -np.percentile(returns, 100 * (1 - alpha))
```

That’s it. No Gaussian assumption. No moments. No math, really.

But also: no generalization. If your history doesn’t contain a Black Swan, this method can’t imagine one.

---

### Plotting them

Here’s a quick simulation to see the difference.

```python
import matplotlib.pyplot as plt

np.random.seed(42)
returns = np.random.normal(0, 0.02, 1000)

param_var = parametric_var(returns, 0.99)
hist_var = historical_var(returns, 0.99)

plt.hist(returns, bins=50, alpha=0.6)
plt.axvline(-param_var, color='red', linestyle='--', label='Parametric VaR')
plt.axvline(-hist_var, color='blue', linestyle='--', label='Historical VaR')
plt.legend()
plt.title("VaR at 99% Confidence")
plt.show()
```

You’ll often find that **historical VaR is more conservative** if your return distribution has big outliers.

---

### What I like about this

Parametric VaR is ridiculously fast and can be extended with covariance matrices for multi-asset portfolios.
Historical VaR is brutally honest: it doesn’t assume normality, and it’s easy to explain to non-quants.

In practice, I usually check both.

---

### What I don’t trust

* Parametric VaR breaks down badly in crises. A few bad assumptions and you get lulled into a false sense of safety.
* Historical VaR has **blind spots**. If something hasn’t happened in your dataset, it literally doesn’t exist to the model.

That’s why banks stress-test both.

---

### What broke (during this post)

* I forgot `np.percentile()` uses linear interpolation between bins. That caused my historical VaR to wobble on small samples.
* Using `np.std()` instead of EWMA underestimates volatility during spikes. Should’ve reused my Aug 5 code.

---

### What I’d try next

* Cornish-Fisher expansion to adjust for skew and kurtosis
* Expected Shortfall (CVaR) instead of VaR — more stable under tail risk
* Combine historical + parametric into a hybrid model

---

### Subtle résumé thread

In my internship project, I used both methods to generate automated daily risk reports for portfolios — with EWMA plugging into the parametric pipeline. When used with anomaly detection, it helped reduce review cycles by 40%. The trick wasn’t inventing a new metric. It was making an old one *work*.

---

### TL;DR

VaR isn’t perfect. But when used honestly—and checked from multiple angles—it’s one of the clearest signals you can get from a noisy market.

Next up: anomaly detection with z-scores and isolation forests. Let’s see if we can catch weird behavior before VaR does.

