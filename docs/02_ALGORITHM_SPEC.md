# Movienator: Mathematical & Algorithmic Specification

## 1. Probabilistic Foundations

Movienator formulates the 20-questions guessing game as a **Bayesian Active Learning** problem on a discrete hypothesis space.

### 1.1 Mathematical Notation
* $\mathcal{C} = \{C_1, C_2, \dots, C_N\}$: Universe of $N$ candidate Indian films (e.g., $N \approx 25,000$).
* $\mathcal{Q} = \{Q_1, Q_2, \dots, Q_M\}$: Universe of $M$ questions/tropes.
* $\mathcal{A}$: 5-point discrete user response alphabet:
  $$\mathcal{A} = \{\text{'Yes'} \, (Y), \; \text{'Probably'} \, (P), \; \text{'Don't Know'} \, (DK), \; \text{'Probably Not'} \, (PN), \; \text{'No'} \, (N)\}$$
* $D_t = \{(Q_{(1)}, a_{(1)}), \dots, (Q_{(t)}, a_{(t)})\}$: History of question-answer pairs observed up to turn $t$.

---

### 1.2 Candidate Prior Distribution $P(C_i)$

Rather than a uniform prior ($1/N$), Indian cinema consumption exhibits a **Power-Law (Zipfian) distribution** where a subset of iconic films (*DDLJ*, *Sholay*, *Baahubali*, *RRR*, *3 Idiots*) represents a majority of queries.

We initialize priors using empirical vote count frequencies from IMDb/TMDb with Dirichlet hyperparameter $\beta > 0$:
$$P(C_i) = \frac{\log_{10}(\text{VoteCount}(C_i) + 10) + \beta}{\sum_{k=1}^N \left(\log_{10}(\text{VoteCount}(C_k) + 10) + \beta\right)}$$

This guarantees that:
1. Blockbusters begin with higher probability mass.
2. Niche, arthouse, or older movies have non-zero prior probability and can be identified if specific tropes match.

---

### 1.3 Likelihood Tensor $\Theta \in \mathbb{R}^{N \times M \times |\mathcal{A}|}$

For every movie $C_i$, question $Q_j$, and answer $a \in \mathcal{A}$, the likelihood is defined as:
$$\theta_{i, j, a} \equiv P(A = a \mid C_i, Q_j)$$

#### Calibrated 5-Point Likelihood Distribution

Let $s_{i,j} \in [0.0, 1.0]$ be the ground-truth affinity between movie $C_i$ and question $Q_j$ (where $1.0$ = definite Yes, $0.0$ = definite No, $0.5$ = neutral/unmentioned).

| Movie Trait Ground Truth ($s_{i,j}$) | Yes ($Y$) | Probably ($P$) | Don't Know ($DK$) | Probably Not ($PN$) | No ($N$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Definite Yes** ($s_{i,j} = 1.0$) | **0.880** | 0.080 | 0.025 | 0.010 | 0.005 |
| **Probable Yes** ($s_{i,j} = 0.75$) | 0.300 | **0.520** | 0.100 | 0.050 | 0.030 |
| **Neutral / Unknown** ($s_{i,j} = 0.50$) | 0.120 | 0.180 | **0.400** | 0.180 | 0.120 |
| **Probable No** ($s_{i,j} = 0.25$) | 0.030 | 0.050 | 0.100 | **0.520** | 0.300 |
| **Definite No** ($s_{i,j} = 0.0$) | 0.005 | 0.010 | 0.025 | 0.080 | **0.880** |

#### Crucial Invariant: "Don't Know" Responses
When a player selects "Don't Know" ($a = DK$), the likelihood $P(DK \mid C_i, Q_j) \approx 0.40$ is nearly flat across all movies. In Bayes' formula, this multiplies all candidate probabilities by the same scalar, **preserving relative odds and penalizing nobody**.

---

### 1.4 Recursive Bayesian Posterior Update

Assuming conditional independence between consecutive answers (Naive Bayes assumption):
$$P(C_i \mid D_t) = \frac{P(a_{(t)} \mid C_i, Q_{(t)}) \cdot P(C_i \mid D_{t-1})}{\sum_{k=1}^N P(a_{(t)} \mid C_k, Q_{(t)}) \cdot P(C_k \mid D_{t-1})}$$

#### Log-Space Formulation (Preventing Underflow)
To avoid floating-point underflow across 20+ multiplications:
$$\ell_i^{(t)} \equiv \ln P(C_i \mid D_t) = \ell_i^{(t-1)} + \ln P(a_{(t)} \mid C_i, Q_{(t)}) - \ln Z_t$$
where $\ln Z_t$ is computed using the numerically stable `LogSumExp` operator:
$$\ln Z_t = m + \ln \left( \sum_{k=1}^N \exp(\ell_k^{(t-1)} + \ln P(a_{(t)} \mid C_k, Q_{(t)}) - m) \right), \quad m = \max_k (\dots)$$

---

## 2. Dynamic Question Selection: Information Gain & Shannon Entropy

### 2.1 Shannon Entropy of the Candidate Space
At turn $t$, current system uncertainty is measured by the Shannon Entropy:
$$H(\mathcal{C} \mid D_t) = - \sum_{i=1}^N P(C_i \mid D_t) \log_2 P(C_i \mid D_t) \quad [\text{bits}]$$

When uncertainty is highest (all movies equally likely), $H = \log_2(25,000) \approx 14.6\text{ bits}$.
When a single movie is identified with 100% confidence, $H = 0\text{ bits}$.

---

### 2.2 Expected Information Gain (Mutual Information)

The Expected Information Gain $E[IG(Q)]$ measures how many bits of uncertainty question $Q$ will eliminate:
$$E[IG(Q)] = I(\mathcal{C}; A_Q \mid D_t) = H(A_Q \mid D_t) - \sum_{i=1}^N P(C_i \mid D_t) H(A_Q \mid C_i)$$

Where:
* $H(A_Q \mid D_t)$ is the **Marginal Answer Entropy** of the user's response:
  $$P(A = a \mid Q, D_t) = \sum_{i=1}^N P(A = a \mid C_i, Q) \cdot P(C_i \mid D_t)$$
  $$H(A_Q \mid D_t) = - \sum_{a \in \mathcal{A}} P(a \mid Q, D_t) \log_2 P(a \mid Q, D_t)$$
* $H(A_Q \mid C_i)$ is the inherent ambiguity of question $Q$ for candidate $C_i$.

#### Why the 50/50 Split Maximizes Information Gain
For binary Yes/No partitions:
$$H_b(p) = -p \log_2 p - (1-p) \log_2 (1-p)$$
Differentiating with respect to $p$ yields a single global maximum at $p = 0.50$ ($H_b(0.5) = 1.0\text{ bit}$).

**Engine Strategy:** The optimal question is the one whose expected answer splits the remaining probability mass as close to 50/50 as possible. This guarantees Generalized Binary Search performance with $O(\log N)$ query complexity.

---

### 2.3 Regularized Question Scoring
To prevent repetitive or awkward questions (e.g., asking three consecutive questions about the lead actor):
$$\text{Score}(Q) = E[IG(Q)] - \lambda_{\text{repeat}} \cdot \text{Similarity}(Q, \mathcal{Q}_{\text{asked}}) + \text{CategoryWeight}(Q)$$

---

## 3. Noise Tolerance & Rebound Theorem

### 3.1 The Failure of Hard Decision Trees
In a rigid decision tree, one wrong user click eliminates the correct movie forever:
$$P(\text{Target}) \times 0 = 0$$

### 3.2 The Bayesian Rebound Proof
In Movienator, likelihoods are bounded below by $\epsilon = 0.005$ ($\epsilon$-floor smoothing):
$$P(A \mid C_i, Q) \ge \epsilon > 0 \quad \forall i, Q, A$$

Suppose the user mistakenly clicks "No" on a question where the target movie is "Yes":
* Target probability is penalized: $\frac{\epsilon}{0.90} \approx \frac{1}{180}$.
* Over the next 3 questions, the user answers accurately on traits where the target is Yes ($P=0.88$) and competitors are No ($P=0.01$).
* The probability multiplier over those 3 questions is:
  $$\left(\frac{0.88}{0.01}\right)^3 = (88)^3 = 681,472$$
* Net recovery odds:
  $$\frac{1}{180} \times 681,472 \approx 3,785$$

**The target movie completely rebounds to #1 even after a human error.**

---

## 4. Guessing Rules & Stopping Criteria

The engine triggers a guess when **any** of the following conditions is met:

1. **Absolute Confidence Threshold:**
   $$P(C_{(1)} \mid D_t) \ge 0.85$$
2. **Runner-Up Margin (Dominance Ratio):**
   $$P(C_{(1)} \mid D_t) \ge 0.65 \quad \text{AND} \quad \frac{P(C_{(1)} \mid D_t)}{P(C_{(2)} \mid D_t)} \ge 4.0$$
3. **Question Limit Checkpoints:**
   * At **Turn 20**: If $P(C_{(1)}) \ge 0.50$, trigger guess. If not, extend to 25 questions.
   * At **Turn 25**: Force guess of $C_{(1)}$.

### Negative Conditioning (If Guess is Rejected)
If the player clicks "No, that's not my movie":
1. Condition on $C \ne C_{\text{guess}}$:
   $$P(C_{\text{guess}}) \leftarrow 0$$
2. Renormalize remaining candidate distribution:
   $$P(C_i) \leftarrow \frac{P(C_i)}{1 - P(C_{\text{guess}})}$$
3. Extend question budget by 5 questions and resume.
