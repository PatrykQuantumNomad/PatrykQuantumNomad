# Remaining Fixes from Graphical Techniques Review

## ALL COMPLETED

### Session 1 (P0 Critical)
1. ✅ weibull-plot: Fixed reversed axes in interpretation
2. ✅ weibull-plot: Fixed "slope" → "reciprocal of the slope" for shape parameter
3. ✅ weibull-plot: Fixed "natural logarithm" → "log base 10"
4. ✅ spectral-plot: Fixed formula mislabel "Blackman-Tukey" → "Periodogram"
5. ✅ box-cox-normality: Fixed Blom → Filliben plotting positions
6. ✅ probability-plot: Fixed techniques.json tier A→B, variantCount 0→3

### Session 2 (P1 Significant)
7. ✅ scatter-plot variants: Replaced "Fan-shaped" and "Step Function" with NIST "Exact Linear" (R=1) and "Homoscedastic" (constant variance). Updated renderer, content examples, and interpretation text.
8. ✅ star-plot: Redesigned to multi-star grid (16 automobile profiles, 4×4 grid with 6 variables). Added `generateStarGrid()` function, exported from index. Updated Python code to show 3×3 grid.

### Session 2 (P2 Minor)
9. ✅ autocorrelation-plot: Aligned variant labels — "MA(1)" → "Moderate Autocorrelation", "Seasonal" → "Sinusoidal Model" in both renderer and content
10. ✅ conditioning-plot: Added 2 missing NIST questions ("Are there outliers?" and "Is there a relationship?")
11. ✅ scatterplot-matrix: Added "Linking and Brushing" mention to importance section
12. ✅ 4-plot: Switched dataset from `timeSeries` to `beamDeflections` (LEW.DAT) to match NIST
13. ✅ scatter-plot: Added formulas array (linear, quadratic, exponential, sinusoidal models)
14. ✅ 6-plot: Added general regression model formula Y_i = f(X_i) + E_i
15. ✅ ppcc-plot: Added "use judgement when selecting" guidance and coarse-then-fine advice
16. ✅ autocorrelation-plot: Added ARIMA widening confidence band formula (Bartlett)

## Full review report: .planning/graphical-techniques-review.md
