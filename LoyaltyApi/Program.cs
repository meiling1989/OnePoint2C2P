using Microsoft.EntityFrameworkCore;
using LoyaltyApi.Data;
using LoyaltyApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Data layer
builder.Services.AddDbContext<LoyaltyDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Service layer
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();
app.Run();
