using Microsoft.EntityFrameworkCore;
using LoyaltyApi.Models;

namespace LoyaltyApi.Data;

public class LoyaltyDbContext : DbContext
{
    public LoyaltyDbContext(DbContextOptions<LoyaltyDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<RedeemOption> RedeemOptions => Set<RedeemOption>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(e =>
        {
            e.HasIndex(c => c.Username).IsUnique();
            e.Property(c => c.Username).HasMaxLength(100);
            e.Property(c => c.Email).HasMaxLength(200);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasIndex(t => t.CustomerId);
            e.Property(t => t.Type).HasMaxLength(20);
        });

        modelBuilder.Entity<Merchant>(e =>
        {
            e.Property(m => m.SwapRate).HasPrecision(18, 4);
        });

        // Seed data
        modelBuilder.Entity<Merchant>().HasData(
            new Merchant { Id = 1, Name = "MerchantA", SwapRate = 0.5m },
            new Merchant { Id = 2, Name = "MerchantB", SwapRate = 0.8m }
        );

        modelBuilder.Entity<Customer>().HasData(
            new Customer { Id = 1, Username = "john", PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"), Email = "john@example.com", Name = "John Doe", Points = 1000 },
            new Customer { Id = 2, Username = "jane", PasswordHash = BCrypt.Net.BCrypt.HashPassword("password456"), Email = "jane@example.com", Name = "Jane Smith", Points = 500 }
        );

        modelBuilder.Entity<RedeemOption>().HasData(
            new RedeemOption { Id = 1, MerchantId = 1, Name = "Free Coffee", PointsCost = 100 },
            new RedeemOption { Id = 2, MerchantId = 1, Name = "Free Lunch", PointsCost = 500 },
            new RedeemOption { Id = 3, MerchantId = 2, Name = "10% Discount", PointsCost = 200 }
        );
    }
}
