---
layout: post
title: "Likelihood: Deep Learning, Regression, Inverse Problems"
date: 2026-08-11 00:00:00 +0900
description: "일반적인 딥러닝, Gaussian regression, inverse problem에서 likelihood가 어떻게 정의되고 각각의 loss로 이어지는지 중간 계산을 생략하지 않고 정리한다."
section: artificial-intelligence
categories: [artificial-intelligence]
tags: []
toc: true
math: true
---

## 0. 표기와 핵심 원칙

- 대문자 $X,Y,N$은 random variable이다.
- 소문자 $x,y,n$은 random variable이 실제로 가지는 값이다.
- $\theta$는 확률분포 또는 network를 결정하는 model parameter다.
- $p(y;\theta)$에서 세미콜론 뒤의 $\theta$는 확률변수가 아니라 model parameter라는 뜻이다.
- $p(y\mid x;\theta)$에서 $x$는 조건으로 주어진 입력이고, $\theta$는 model parameter다.

Likelihood에는 별도의 기호를 만들지 않고 그대로 $p$를 사용한다.

$$
\text{likelihood}=p(y;\theta)
$$

또는 supervised learning에서는

$$
\text{conditional likelihood}=p(y\mid x;\theta)
$$

라고 쓴다. 최적화할 negative log-likelihood는 별도의 수학 기호를 만들지 않고 다음과 같이 쓴다.

$$
\text{loss}=-\log p(y\mid x;\theta)
$$

Likelihood 자체가 MSE인 것은 아니다. Gaussian likelihood에 negative log를 취하고, 최적화 변수와 무관한 항을 제거했을 때 MSE를 최소화하는 문제가 나온다.

또한

$$
\log p(y\mid x;\theta)
$$

가 어떤 확률분포를 따르는 것이 아니다. 확률분포를 따르는 것은 $(Y\mid X=x)$이고, $\log p(y\mid x;\theta)$는 선택한 조건부 분포가 실제 관측값 $y$에 부여한 probability 또는 density에 log를 취한 값이다.

## 1. 일반적인 딥러닝에서의 likelihood

### 1.1 일반적인 확률모델

관측 데이터가 random variable $Y$이고 model parameter가 $\theta$라고 하자. 먼저 $Y$가 따르는 확률분포를 정한다.

$$
Y\sim p(\,\cdot\,;\theta)
$$

$\cdot$은 가능한 $Y$의 값이 들어가는 자리다. $Y$가 실제로 $y$라는 값을 가질 probability 또는 density는

$$
\boxed{p(y;\theta)}
$$

이다.

$\theta$를 고정하고 $y$를 변화시키면 $p(y;\theta)$는 $Y$의 확률분포다. 연속적인 $Y$라면

$$
\int p(y;\theta)\,dy=1
$$

을 만족한다.

반대로 실제 데이터 $y$를 고정하고 $\theta$를 변화시키면서 같은 $p(y;\theta)$를 바라보면 likelihood다. 즉, likelihood는 새로운 식이 아니라 동일한 probability 또는 density를 model parameter $\theta$에 대한 함수로 해석한 것이다.

### 1.2 여러 데이터의 likelihood와 loss

관측 데이터가

$$
y_1,y_2,\ldots,y_N
$$

이라고 하자. 각 데이터가 $\theta$가 주어졌을 때 서로 독립이라고 가정하면 joint probability 또는 density는

$$
\begin{aligned}
p(y_1,\ldots,y_N;\theta)
&=p(y_1;\theta)p(y_2;\theta)\cdots p(y_N;\theta)\\
&=\prod_{i=1}^{N}p(y_i;\theta)
\end{aligned}
$$

가 된다.

Maximum likelihood 학습에서는 이 값을 가장 크게 만드는 $\theta$를 찾는다.

$$
\hat\theta
=
\arg\max_\theta
\prod_{i=1}^{N}p(y_i;\theta)
$$

$\log$는 단조 증가 함수이므로 양수 $a,b$에 대해

$$
a>b
\quad\Longleftrightarrow\quad
\log a>\log b
$$

가 성립한다. 따라서 log를 취해도 최댓값을 만드는 $\theta$는 변하지 않는다.

$$
\begin{aligned}
\hat\theta
&=
\arg\max_\theta
\log\left(
\prod_{i=1}^{N}p(y_i;\theta)
\right)\\
&=
\arg\max_\theta
\sum_{i=1}^{N}\log p(y_i;\theta)
\end{aligned}
$$

두 번째 등호에서는

$$
\log(a_1a_2\cdots a_N)
=
\log a_1+\log a_2+\cdots+\log a_N
$$

을 사용했다.

최대화 문제를 최소화 문제로 바꾸기 위해 음수를 붙이면

$$
\boxed{
\text{loss}
=
-\sum_{i=1}^{N}\log p(y_i;\theta)
}
$$

이고,

$$
\boxed{
\hat\theta
=
\arg\min_\theta\text{loss}
}
$$

가 된다.

### 1.3 Supervised learning의 조건부 분포 가정

Supervised learning에서는 입력 $X=x$가 추가로 주어진다. 이때 target $Y$의 종류에 맞는 조건부 분포를 먼저 선택해야 한다.

가장 일반적으로는

$$
\boxed{
\left(Y\mid X=x\right)
\sim
q\left(\,\cdot\,;\eta_\theta(x)\right)
}
$$

라고 쓸 수 있다.

- $q$: 문제에 맞게 선택한 확률분포
- $\eta_\theta(x)$: 입력 $x$를 받은 network가 출력하는 분포의 parameter
- $\cdot$: 가능한 target $Y$의 값이 들어가는 자리

실제 target이 $y$라면 조건부 probability 또는 density는

$$
\boxed{
p(y\mid x;\theta)
=
q\left(y;\eta_\theta(x)\right)
}
$$

이다.

한 데이터의 negative log-likelihood는

$$
\begin{aligned}
\text{loss}
&=-\log p(y\mid x;\theta)\\
&=-\log q\left(y;\eta_\theta(x)\right)
\end{aligned}
$$

이다.

여러 학습 데이터가 입력이 주어졌을 때 서로 조건부 독립이라고 가정하면

$$
\begin{aligned}
&p(y_1,\ldots,y_N
\mid x_1,\ldots,x_N;\theta)\\
&=\prod_{i=1}^{N}p(y_i\mid x_i;\theta)\\
&=\prod_{i=1}^{N}q\left(y_i;\eta_\theta(x_i)\right)
\end{aligned}
$$

이다. Negative log를 취하면

$$
\begin{aligned}
\text{loss}
&=-\log\left[
\prod_{i=1}^{N}q\left(y_i;\eta_\theta(x_i)\right)
\right]\\
&=-\sum_{i=1}^{N}
\log q\left(y_i;\eta_\theta(x_i)\right)
\end{aligned}
$$

가 된다.

여기서는 $q$를 구체적으로 정하지 않았으므로 loss의 구체적인 형태도 아직 정해지지 않았다. Target과 문제의 종류에 따라 Categorical, Bernoulli, Gaussian 등의 분포를 선택한다.

### 1.4 Multi-class classification의 Categorical likelihood

$K$개 class를 분류한다고 하자. Network가 출력한 logit을

$$
a_\theta(x)
=
\left(
a_{\theta,1}(x),\ldots,a_{\theta,K}(x)
\right)
$$

라고 하자. Softmax를 적용하면 각 class의 probability가 된다.

$$
\pi_{\theta,k}(x)
=
\frac{
\exp(a_{\theta,k}(x))
}{
\sum_{j=1}^{K}\exp(a_{\theta,j}(x))
}
$$

각 probability는

$$
\pi_{\theta,k}(x)\geq0
$$

이고

$$
\sum_{k=1}^{K}\pi_{\theta,k}(x)=1
$$

을 만족한다.

Target의 조건부 분포를 Categorical로 가정한다.

$$
\boxed{
\left(Y\mid X=x\right)
\sim
\operatorname{Categorical}\left(\pi_\theta(x)\right)
}
$$

실제 정답 class가 $y$라면

$$
\boxed{
p(y\mid x;\theta)
=
\pi_{\theta,y}(x)
}
$$

이다. 따라서 한 데이터의 loss는

$$
\begin{aligned}
\text{loss}
&=-\log p(y\mid x;\theta)\\
&=-\log\pi_{\theta,y}(x)
\end{aligned}
$$

이다.

One-hot target $y_k$를 사용하면

$$
y_k=
\begin{cases}
1, & k\text{가 정답 class일 때}\\
0, & k\text{가 정답 class가 아닐 때}
\end{cases}
$$

이므로 같은 loss를

$$
\boxed{
\text{loss}
=
-\sum_{k=1}^{K}
y_k\log\pi_{\theta,k}(x)
}
$$

라고 쓸 수 있다. 이것이 categorical cross-entropy다.

### 1.5 Binary classification의 Bernoulli likelihood

Binary classification에서는 $Y\in\{0,1\}$이고 network가 $Y=1$일 probability를 출력한다고 하자.

$$
r_\theta(x)
=
p(Y=1\mid x;\theta)
$$

그러면

$$
p(Y=0\mid x;\theta)
=
1-r_\theta(x)
$$

이다. Target의 조건부 분포를 Bernoulli로 가정하면

$$
\boxed{
\left(Y\mid X=x\right)
\sim
\operatorname{Bernoulli}\left(r_\theta(x)\right)
}
$$

이고, $y\in\{0,1\}$에 대한 조건부 probability는

$$
\boxed{
p(y\mid x;\theta)
=
r_\theta(x)^y
\left(1-r_\theta(x)\right)^{1-y}
}
$$

이다. Negative log를 취하면

$$
\begin{aligned}
\text{loss}
&=-\log\left[
r_\theta(x)^y
\left(1-r_\theta(x)\right)^{1-y}
\right]\\
&=-\log r_\theta(x)^y
-\log\left(1-r_\theta(x)\right)^{1-y}\\
&=-y\log r_\theta(x)
-(1-y)\log\left(1-r_\theta(x)\right)
\end{aligned}
$$

가 된다. 이것이 binary cross-entropy다.

## 2. Regression에서의 likelihood

### 2.1 Gaussian regression의 조건부 분포 가정

입력 $x$에 대한 network의 출력을

$$
f_\theta(x)
$$

라고 하자. Gaussian regression에서는 실제 target $Y$가 network 출력 주변의 Gaussian 분포를 따른다고 가정한다.

$$
\boxed{
\left(Y\mid X=x\right)
\sim
\mathcal N\left(
f_\theta(x),
\sigma^2I_d
\right)
}
$$

여기서

- $f_\theta(x)$는 조건부 Gaussian의 평균이다.
- $\sigma^2I_d$는 조건부 Gaussian의 covariance다.
- $d$는 target $y$의 차원이다.

즉,

$$
\mathbb E[Y\mid X=x]
=
f_\theta(x)
$$

이고

$$
\operatorname{Cov}(Y\mid X=x)
=
\sigma^2I_d
$$

라고 가정한 것이다.

### 2.2 Multivariate Gaussian density에 값 대입

일반적인 $d$차원 Gaussian

$$
Z\sim\mathcal N(\mu,\Sigma)
$$

의 density는

$$
p(z;\mu,\Sigma)
=
\frac{1}
{(2\pi)^{d/2}|\Sigma|^{1/2}}
\exp\left(
-\frac{1}{2}
(z-\mu)^\top
\Sigma^{-1}
(z-\mu)
\right)
$$

이다.

Gaussian regression에서는

$$
z=y,
\qquad
\mu=f_\theta(x),
\qquad
\Sigma=\sigma^2I_d
$$

를 대입한다.

먼저 covariance determinant는

$$
\begin{aligned}
|\Sigma|
&=|\sigma^2I_d|\\
&=(\sigma^2)^d
\end{aligned}
$$

이다. 따라서

$$
\begin{aligned}
|\Sigma|^{1/2}
&=\left((\sigma^2)^d\right)^{1/2}\\
&=(\sigma^2)^{d/2}
\end{aligned}
$$

이다.

Covariance의 역행렬은

$$
\begin{aligned}
\Sigma^{-1}
&=(\sigma^2I_d)^{-1}\\
&=\frac{1}{\sigma^2}I_d
\end{aligned}
$$

이다.

Gaussian density의 이차항은

$$
\begin{aligned}
&(y-f_\theta(x))^\top
\Sigma^{-1}
(y-f_\theta(x))\\
&=(y-f_\theta(x))^\top
\left(\frac{1}{\sigma^2}I_d\right)
(y-f_\theta(x))\\
&=\frac{1}{\sigma^2}
(y-f_\theta(x))^\top
(y-f_\theta(x))\\
&=\frac{1}{\sigma^2}
\lVert y-f_\theta(x)\rVert_2^2
\end{aligned}
$$

가 된다.

### 2.3 Gaussian regression likelihood

위 계산을 Gaussian density에 모두 대입하면

$$
\boxed{
p(y\mid x;\theta)
=
\frac{1}
{(2\pi\sigma^2)^{d/2}}
\exp\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{
2\sigma^2
}
\right)
}
$$

를 얻는다.

Likelihood 자체가 squared error인 것은 아니다.

$$
p(y\mid x;\theta)
\neq
\lVert y-f_\theta(x)\rVert_2^2
$$

정확하게는 Gaussian likelihood의 지수 안에 squared error가 들어 있다.

$$
p(y\mid x;\theta)
=
\frac{1}
{(2\pi\sigma^2)^{d/2}}
\exp\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{
2\sigma^2
}
\right)
$$

### 2.4 Negative log-likelihood에서 MSE까지 전개

한 데이터의 loss는

$$
\text{loss}
=
-\log p(y\mid x;\theta)
$$

이다. Gaussian likelihood를 그대로 대입하면

$$
\begin{aligned}
\text{loss}
&=-\log\left[
\frac{1}
{(2\pi\sigma^2)^{d/2}}
\exp\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
\right)
\right]\\
&=-\log\left[
\frac{1}
{(2\pi\sigma^2)^{d/2}}
\right]\\
&\quad
-\log\left[
\exp\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
\right)
\right]
\end{aligned}
$$

이다.

첫 번째 항은

$$
\begin{aligned}
-\log\left[
\frac{1}{(2\pi\sigma^2)^{d/2}}
\right]
&=-\log\left[(2\pi\sigma^2)^{-d/2}\right]\\
&=\frac{d}{2}\log(2\pi\sigma^2)
\end{aligned}
$$

이다.

두 번째 항은 $\log(\exp(a))=a$를 사용하면

$$
\begin{aligned}
&-\log\left[
\exp\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
\right)
\right]\\
&=-\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
\right)\\
&=\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
\end{aligned}
$$

이다.

따라서

$$
\boxed{
\text{loss}
=
\frac{d}{2}\log(2\pi\sigma^2)
+
\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
}
$$

이다.

여러 데이터에 대해서는

$$
\begin{aligned}
\text{loss}
&=-\sum_{i=1}^{N}\log p(y_i\mid x_i;\theta)\\
&=\sum_{i=1}^{N}\left[
\frac{d}{2}\log(2\pi\sigma^2)
+
\frac{
\lVert y_i-f_\theta(x_i)\rVert_2^2
}{2\sigma^2}
\right]\\
&=\frac{Nd}{2}\log(2\pi\sigma^2)
+
\frac{1}{2\sigma^2}
\sum_{i=1}^{N}
\lVert y_i-f_\theta(x_i)\rVert_2^2
\end{aligned}
$$

가 된다.

$\sigma^2$를 고정하면

$$
\frac{Nd}{2}\log(2\pi\sigma^2)
$$

는 $\theta$와 무관한 상수다. 또한

$$
\frac{1}{2\sigma^2}>0
$$

이므로 이 양의 상수를 곱하거나 나누어도 최솟값을 만드는 $\theta$는 바뀌지 않는다. 따라서

$$
\begin{aligned}
\arg\min_\theta\text{loss}
&=\arg\min_\theta
\left[
\frac{Nd}{2}\log(2\pi\sigma^2)
+
\frac{1}{2\sigma^2}
\sum_{i=1}^{N}
\lVert y_i-f_\theta(x_i)\rVert_2^2
\right]\\
&=\arg\min_\theta
\frac{1}{2\sigma^2}
\sum_{i=1}^{N}
\lVert y_i-f_\theta(x_i)\rVert_2^2\\
&=\arg\min_\theta
\sum_{i=1}^{N}
\lVert y_i-f_\theta(x_i)\rVert_2^2\\
&=\arg\min_\theta
\frac{1}{N}
\sum_{i=1}^{N}
\lVert y_i-f_\theta(x_i)\rVert_2^2
\end{aligned}
$$

가 된다. 마지막 식이 MSE다.

$$
\boxed{
\text{MSE}
=
\frac{1}{N}
\sum_{i=1}^{N}
\lVert y_i-f_\theta(x_i)\rVert_2^2
}
$$

따라서

$$
\boxed{
\text{Gaussian likelihood 최대화}
\quad\Longleftrightarrow\quad
\text{MSE 최소화}
}
$$

이다.

일반적인 supervised regression의 squared error는

$$
\lVert y-f_\theta(x)\rVert_2^2
$$

이다. Network가 예측한 값을 별도로 $\hat y=f_\theta(x)$라고 쓰면

$$
\lVert y-\hat y\rVert_2^2
$$

이다. 만약 예측값 $\hat y$ 자체를 $x$라고 다시 표기한 문맥에서만

$$
\lVert y-x\rVert_2^2
$$

라고 쓸 수 있다.

## 3. Inverse problem에서의 likelihood

### 3.1 변수의 의미와 관측모델

Inverse problem에서는 regression과 같은 $x,y$ 기호를 사용하더라도 의미가 다르다.

- $X$: 복원해야 하는 원본 random variable
- $x$: 후보 원본 이미지
- $Y$: 관측 random variable
- $y$: 실제로 주어진 관측값
- $H$: 원본을 관측공간으로 변환하는 forward operator
- $N$: 관측 noise random variable

관측모델은

$$
Y=HX+N
$$

이고 noise는

$$
N\sim\mathcal N(0,\sigma_n^2I_m)
$$

이라고 가정한다. 또한 noise $N$과 원본 $X$가 서로 독립이라고 가정한다.

$$
N\perp X
$$

후보 원본을 $X=x$라고 고정하면 관측식의 $X$ 자리에 $x$를 대입한다.

$$
\boxed{
\text{조건 }(X=x)\text{ 아래에서}
\qquad
Y=Hx+N
}
$$

### 3.2 조건부 평균 전개

조건부 평균은

$$
\mathbb E[Y\mid X=x]
$$

이다. 관측식을 대입하면

$$
\begin{aligned}
\mathbb E[Y\mid X=x]
&=\mathbb E[Hx+N\mid X=x]\\
&=\mathbb E[Hx\mid X=x]
+\mathbb E[N\mid X=x]
\end{aligned}
$$

이다. 두 번째 등호에서는 conditional expectation의 선형성을 사용했다.

조건 $X=x$ 아래에서 $Hx$는 고정된 값이므로

$$
\mathbb E[Hx\mid X=x]=Hx
$$

이다.

$N$과 $X$가 독립이므로 $X=x$라는 조건을 알아도 $N$의 분포는 바뀌지 않는다. 따라서

$$
\mathbb E[N\mid X=x]
=
\mathbb E[N]
$$

이다. Noise의 평균이 0이므로

$$
\mathbb E[N]=0
$$

이다. 그러므로

$$
\begin{aligned}
\mathbb E[Y\mid X=x]
&=Hx+\mathbb E[N]\\
&=Hx+0\\
&=Hx
\end{aligned}
$$

이고, 최종적으로

$$
\boxed{
\mathbb E[Y\mid X=x]=Hx
}
$$

를 얻는다.

### 3.3 조건부 covariance 전개

조건부 covariance의 정의는

$$
\begin{aligned}
\operatorname{Cov}(Y\mid X=x)
&=\mathbb E\Big[
\left(Y-\mathbb E[Y\mid X=x]\right)\\
&\qquad\qquad
\left(Y-\mathbb E[Y\mid X=x]\right)^\top
\mid X=x
\Big]
\end{aligned}
$$

이다.

앞에서

$$
Y=Hx+N
$$

이고

$$
\mathbb E[Y\mid X=x]=Hx
$$

라는 것을 구했다. 따라서 평균을 뺀 값은

$$
\begin{aligned}
Y-\mathbb E[Y\mid X=x]
&=(Hx+N)-Hx\\
&=N
\end{aligned}
$$

이다.

이를 conditional covariance 정의에 대입하면

$$
\begin{aligned}
\operatorname{Cov}(Y\mid X=x)
&=\mathbb E[NN^\top\mid X=x]
\end{aligned}
$$

이다.

$N$과 $X$가 독립이므로

$$
\mathbb E[NN^\top\mid X=x]
=
\mathbb E[NN^\top]
$$

이다.

Noise covariance의 정의는

$$
\operatorname{Cov}(N)
=
\mathbb E\left[
(N-\mathbb E[N])
(N-\mathbb E[N])^\top
\right]
$$

이다. $\mathbb E[N]=0$을 대입하면

$$
\begin{aligned}
\operatorname{Cov}(N)
&=\mathbb E[(N-0)(N-0)^\top]\\
&=\mathbb E[NN^\top]
\end{aligned}
$$

이다.

처음에

$$
N\sim\mathcal N(0,\sigma_n^2I_m)
$$

라고 가정했으므로

$$
\operatorname{Cov}(N)=\sigma_n^2I_m
$$

이다. 따라서

$$
\begin{aligned}
\operatorname{Cov}(Y\mid X=x)
&=\mathbb E[NN^\top\mid X=x]\\
&=\mathbb E[NN^\top]\\
&=\operatorname{Cov}(N)\\
&=\sigma_n^2I_m
\end{aligned}
$$

이고, 최종적으로

$$
\boxed{
\operatorname{Cov}(Y\mid X=x)
=
\sigma_n^2I_m
}
$$

를 얻는다.

$I_m$은 관측공간의 각 좌표가 서로 독립이라는 구조를 나타내고, $\sigma_n^2$은 각 좌표의 noise variance를 나타낸다. 만약 standard Gaussian noise

$$
N\sim\mathcal N(0,I_m)
$$

을 가정했다면 covariance는 $I_m$이 된다. 현재는 각 좌표의 noise standard deviation이 $\sigma_n$이므로 covariance가 $\sigma_n^2I_m$이다.

### 3.4 관측값의 조건부 Gaussian 분포

조건 $X=x$ 아래에서

$$
Y=Hx+N
$$

이다. Gaussian random variable $N$에 고정된 vector $Hx$를 더하면 Gaussian 분포의 평균만 $Hx$만큼 이동하고 covariance는 변하지 않는다.

앞에서 조건부 평균과 covariance를 직접 계산하여

$$
\mathbb E[Y\mid X=x]=Hx
$$

및

$$
\operatorname{Cov}(Y\mid X=x)=\sigma_n^2I_m
$$

을 얻었다. 따라서

$$
\boxed{
\left(Y\mid X=x\right)
\sim
\mathcal N(Hx,\sigma_n^2I_m)
}
$$

이다.

### 3.5 Inverse problem의 Gaussian likelihood

일반적인 $m$차원 Gaussian density에

$$
z=y,
\qquad
\mu=Hx,
\qquad
\Sigma=\sigma_n^2I_m
$$

을 대입한다.

Covariance determinant는

$$
\begin{aligned}
|\Sigma|
&=|\sigma_n^2I_m|\\
&=(\sigma_n^2)^m
\end{aligned}
$$

이고

$$
|\Sigma|^{1/2}
=
(\sigma_n^2)^{m/2}
$$

이다.

Covariance의 역행렬은

$$
\begin{aligned}
\Sigma^{-1}
&=(\sigma_n^2I_m)^{-1}\\
&=\frac{1}{\sigma_n^2}I_m
\end{aligned}
$$

이다.

Gaussian density의 이차항은

$$
\begin{aligned}
&(y-Hx)^\top
\Sigma^{-1}
(y-Hx)\\
&=(y-Hx)^\top
\left(\frac{1}{\sigma_n^2}I_m\right)
(y-Hx)\\
&=\frac{1}{\sigma_n^2}
(y-Hx)^\top(y-Hx)\\
&=\frac{1}{\sigma_n^2}
\lVert y-Hx\rVert_2^2
\end{aligned}
$$

이다.

따라서 inverse problem의 likelihood는

$$
\boxed{
p(y\mid x)
=
\frac{1}
{(2\pi\sigma_n^2)^{m/2}}
\exp\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{
2\sigma_n^2
}
\right)
}
$$

이다.

Likelihood 자체가 squared error인 것은 아니다.

$$
p(y\mid x)
\neq
\lVert y-Hx\rVert_2^2
$$

정확하게는

$$
p(y\mid x)
=
\frac{1}
{(2\pi\sigma_n^2)^{m/2}}
\exp\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{
2\sigma_n^2
}
\right)
$$

이다.

### 3.6 Negative log-likelihood에서 관측 오차까지 전개

후보 원본 $x$에 대해

$$
\text{loss}
=
-\log p(y\mid x)
$$

라고 쓴다. Gaussian likelihood를 그대로 대입하면

$$
\begin{aligned}
\text{loss}
&=-\log\left[
\frac{1}
{(2\pi\sigma_n^2)^{m/2}}
\exp\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\right)
\right]\\
&=-\log\left[
\frac{1}
{(2\pi\sigma_n^2)^{m/2}}
\right]\\
&\quad
-\log\left[
\exp\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\right)
\right]
\end{aligned}
$$

이다.

첫 번째 항은

$$
\begin{aligned}
-\log\left[
\frac{1}{(2\pi\sigma_n^2)^{m/2}}
\right]
&=-\log\left[(2\pi\sigma_n^2)^{-m/2}\right]\\
&=\frac{m}{2}\log(2\pi\sigma_n^2)
\end{aligned}
$$

이다.

두 번째 항은

$$
\begin{aligned}
&-\log\left[
\exp\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\right)
\right]\\
&=-\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\right)\\
&=\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\end{aligned}
$$

이다.

따라서

$$
\boxed{
\text{loss}
=
\frac{m}{2}\log(2\pi\sigma_n^2)
+
\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
}
$$

이다.

$m$과 $\sigma_n^2$이 고정되어 있다면

$$
\frac{m}{2}\log(2\pi\sigma_n^2)
$$

는 후보 $x$와 무관한 상수이고

$$
\frac{1}{2\sigma_n^2}>0
$$

이다. 따라서

$$
\begin{aligned}
\arg\min_x\text{loss}
&=\arg\min_x\left[
\frac{m}{2}\log(2\pi\sigma_n^2)
+
\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\right]\\
&=\arg\min_x
\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}\\
&=\arg\min_x
\lVert y-Hx\rVert_2^2
\end{aligned}
$$

이다.

즉,

$$
\boxed{
\text{inverse problem의 Gaussian likelihood 최대화}
\quad\Longleftrightarrow\quad
\lVert y-Hx\rVert_2^2\text{ 최소화}
}
$$

이다.

### 3.7 Likelihood와 prior를 결합하여 posterior 얻기

Inverse problem에서는 서로 다른 여러 원본 $x$가 비슷한 관측 $y$를 만들 수 있으므로 likelihood만으로 원본이 하나로 결정되지 않을 수 있다. 따라서 원본에 대한 prior $p(x)$와 likelihood $p(y\mid x)$를 결합한다.

조건부 probability의 정의에 의해

$$
p(x\mid y)
=
\frac{p(x,y)}{p(y)}
$$

이다.

Joint probability는 chain rule에 의해

$$
p(x,y)
=
p(y\mid x)p(x)
$$

이다. 이를 대입하면

$$
p(x\mid y)
=
\frac{p(y\mid x)p(x)}{p(y)}
$$

가 된다.

분모 $p(y)$는 $x$에 대해 적분하여 구한다.

$$
\begin{aligned}
p(y)
&=\int p(x,y)\,dx\\
&=\int p(y\mid x)p(x)\,dx
\end{aligned}
$$

따라서 posterior의 정확한 식은

$$
\boxed{
p(x\mid y)
=
\frac{
p(y\mid x)p(x)
}{
\int p(y\mid x')p(x')\,dx'
}
}
$$

이다. 적분변수와 posterior에서 평가하는 후보를 구분하기 위해 분모에서는 $x'$를 사용했다.

분모는 후보 $x$에 따라 변하지 않는 normalization constant이므로

$$
\boxed{
p(x\mid y)
\propto
p(y\mid x)p(x)
}
$$

라고 쓸 수 있다.

FLOWER에서는 현재 flow 상태 $x_t$까지 알고 있으므로 복원하려는 최종 이미지 $x_1$의 조건부 posterior를 사용한다.

$$
p(x_1\mid x_t,y)
=
\frac{p(x_1,x_t,y)}{p(x_t,y)}
$$

분자의 joint probability를 chain rule로 전개하면

$$
p(x_1,x_t,y)
=
p(y\mid x_1,x_t)p(x_1\mid x_t)p(x_t)
$$

이고, 분모는

$$
p(x_t,y)
=
p(y\mid x_t)p(x_t)
$$

이다. 두 식을 대입하고 $p(x_t)$를 약분하면

$$
\begin{aligned}
p(x_1\mid x_t,y)
&=
\frac{
p(y\mid x_1,x_t)p(x_1\mid x_t)p(x_t)
}{
p(y\mid x_t)p(x_t)
}\\
&=
\frac{
p(y\mid x_1,x_t)p(x_1\mid x_t)
}{
p(y\mid x_t)
}
\end{aligned}
$$

이다.

관측모델에서 최종 이미지 $X_1$을 알면 관측 $Y$를 생성하는 데 현재 flow 상태 $X_t$의 정보가 추가로 필요하지 않다고 가정한다.

$$
Y\perp X_t\mid X_1
$$

따라서

$$
p(y\mid x_1,x_t)
=
p(y\mid x_1)
$$

이고

$$
\begin{aligned}
p(x_1\mid x_t,y)
&=
\frac{
p(y\mid x_1)p(x_1\mid x_t)
}{
p(y\mid x_t)
}\\
&\propto
p(y\mid x_1)p(x_1\mid x_t)
\end{aligned}
$$

가 된다. 여기서 생략한 normalization constant는

$$
p(y\mid x_t)
=
\int
p(y\mid x_1')
p(x_1'\mid x_t)
\,dx_1'
$$

이다.

## 4. 세 경우의 차이

| 구분 | 확률분포 가정 | 실제로 고정하는 것 | 찾는 것 | Gaussian일 때 나오는 squared error |
|---|---|---|---|---|
| 일반적인 딥러닝 | $Y\sim p(\,\cdot\,;\theta)$ | 관측 데이터 $y$ | model parameter $\theta$ | 선택한 모델에 따라 다름 |
| Supervised regression | $(Y\mid X=x)\sim\mathcal N(f_\theta(x),\sigma^2I)$ | 입력 $x$와 target $y$ | network parameter $\theta$ | $\lVert y-f_\theta(x)\rVert_2^2$ |
| Inverse problem | $(Y\mid X=x)\sim\mathcal N(Hx,\sigma_n^2I)$ | 관측값 $y$ | 원본 $x$ | $\lVert y-Hx\rVert_2^2$ |

핵심 관계를 다시 쓰면 다음과 같다.

일반적인 딥러닝의 likelihood는

$$
p(y;\theta)
$$

이다. Supervised learning에서는 입력 조건이 추가되어

$$
p(y\mid x;\theta)
$$

를 사용한다.

Gaussian regression에서는

$$
p(y\mid x;\theta)
=
\frac{1}
{(2\pi\sigma^2)^{d/2}}
\exp\left(
-\frac{
\lVert y-f_\theta(x)\rVert_2^2
}{2\sigma^2}
\right)
$$

이고, negative log를 취하면 MSE와 같은 최적화 문제가 된다.

Inverse problem에서는

$$
p(y\mid x)
=
\frac{1}
{(2\pi\sigma_n^2)^{m/2}}
\exp\left(
-\frac{
\lVert y-Hx\rVert_2^2
}{2\sigma_n^2}
\right)
$$

이고, negative log를 취하면 관측 일치도

$$
\lVert y-Hx\rVert_2^2
$$

를 최소화하는 문제와 같아진다.
