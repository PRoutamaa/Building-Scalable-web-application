export const levenshteinDistance = (submission, solution) => {
    if (submission.length !== 0 && solution.length !== 0) {
        console.log("Helloi")
        const m = submission.length;
        const n = solution.length;
        const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        console.log(d)

        for (let i = 0; i <= m; i++) {
            d[i][0] = i;
        }
        for (let j = 0; j <= n; j++) {
            d[0][j] = j;
        }

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                let substitutionCost = 0;
                if (submission[i -1] !== solution[j - 1]) {
                    substitutionCost = 1
                }

                d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + substitutionCost)
            }
        }
        return d[m][n];
    };
    console.log(`setting grade of ${submission.length} - ${solution.length} to `, Math.abs(submission.length - solution.length))
    return Math.abs(submission.length - solution.length);
}