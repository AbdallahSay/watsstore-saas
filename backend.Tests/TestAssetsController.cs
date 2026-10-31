using Microsoft.AspNetCore.Mvc;
namespace WatsStore.Tests;
[ApiController]
public class TestAssetsController : ControllerBase
{
    [HttpGet("/test-product.svg")]
    public IActionResult Image() => Content("""
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
        <defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#d8c7b4"/><stop offset="1" stop-color="#ac917b"/></linearGradient>
        <linearGradient id="g"><stop stop-color="#715344"/><stop offset=".5" stop-color="#b48c65"/><stop offset="1" stop-color="#553c30"/></linearGradient></defs>
        <rect width="800" height="1000" fill="url(#b)"/><ellipse cx="440" cy="837" rx="210" ry="35" fill="#493123" opacity=".2"/>
        <rect x="220" y="785" width="450" height="220" fill="#c9b49b"/>
        <rect x="300" y="400" width="230" height="360" rx="16" fill="url(#g)"/>
        <rect x="337" y="320" width="156" height="100" rx="8" fill="#29241f"/>
        <rect x="327" y="510" width="176" height="145" fill="#ede6d8"/>
        <text x="415" y="568" text-anchor="middle" fill="#40372e" font-family="serif" font-size="28">ATELIER</text>
        <text x="415" y="609" text-anchor="middle" fill="#6a5c50" font-family="sans-serif" font-size="12">TEST FIXTURE · 01</text></svg>
        """, "image/svg+xml");
}
