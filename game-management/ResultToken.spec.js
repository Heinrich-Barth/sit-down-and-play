const ResultToken = require("./ResultToken");

test("ResultToken.create", () => {

    const result = ResultToken.create({ time: Date.now() });
    const result2 = ResultToken.create({ time3: Date.now() });

    expect(result.split(".").length).toEqual(3)
    expect(result.length).toBeGreaterThan(10);

    expect(result2.length).toBeGreaterThan(10);
    expect(result2).not.toEqual(result);
});
    
test("ResultToken.validate", () => {

    const time = Date.now();

    const result = ResultToken.create({ time: time });
    const result2 = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0aW1lIjoxNjc5OTA1MjM2NDIwfQ.hmC8HyKRUggBpjopUvzzWHwq-xs984wj2qo1Z7JOwWfhfhxRn8zdgfK3tFuzPgWBa-cT1PgSrJai9-zBXMptJg";

    expect(ResultToken.validate(result)).toBeTruthy();
    expect(ResultToken.validate()).toBeFalsy();
    expect(ResultToken.validate("")).toBeFalsy();
    expect(ResultToken.validate(result2)).toBeFalsy();
});