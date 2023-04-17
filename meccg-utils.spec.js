const UTILS = require("./meccg-utils")

test("createContentSecurityPolicySelfOnly", () => {

    const res = UTILS.createContentSecurityPolicySelfOnly();
    expect(res).toEqual("default-src 'none'; font-src 'self'; script-src 'self'; connect-src 'self'; style-src 'self'; img-src 'self'; report-uri /csp-violation;");
});


test("createContentSecurityPolicyMegaAdditionals", () => {

    const res = UTILS.createContentSecurityPolicyMegaAdditionals();
    expect(res).toEqual("default-src 'none'; style-src 'self'; connect-src 'self' ; font-src 'self'; script-src 'self' 'nonce-START'; frame-src 'self'; img-src 'self' ; report-uri /csp-violation;");
});


test("createSecret", () => {
    const res = UTILS.createSecret();
    expect(res.length).toBeGreaterThan(40);
});

test("createSecret", () => {
    const res = UTILS.generateFlatUuid();
    expect(res.length).toEqual(36);
    expect(res.includes("-")).toBeFalsy();
});

test("createSecret", () => {
    const res = UTILS.generateUuid();
    expect(res.length).toEqual(36);
});

test("isAlphaNumeric", () => {
    
    expect(UTILS.isAlphaNumeric("")).toBeFalsy();
    expect(UTILS.isAlphaNumeric("-")).toBeFalsy();
    expect(UTILS.isAlphaNumeric("asd-")).toBeFalsy();
    expect(UTILS.isAlphaNumeric("asd3")).toBeTruthy();
});

test("uuidLength", () => expect(UTILS.uuidLength()).toEqual(36));
