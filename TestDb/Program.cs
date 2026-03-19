using Npgsql;

var connections = new Dictionary<string, string>
{
    ["1. Direct"] =
        "Host=db.mgsoawteaksivsakobny.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=HTS84dzy0fa4utGF;Timeout=15;SSL Mode=Prefer",

    ["2. Pooler (6543)"] =
        "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Timeout=15",

    ["3. Pooler (5432)"] =
        "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Timeout=15",
};

foreach (var (label, connStr) in connections)
{
    Console.WriteLine($"\n--- {label} ---");
    try
    {
        await using var conn = new NpgsqlConnection(connStr);
        await conn.OpenAsync();
        Console.WriteLine("  => SUCCESS! Server: " + conn.ServerVersion);

        await using var cmd = new NpgsqlCommand("SELECT current_database(), current_user", conn);
        await using var r = await cmd.ExecuteReaderAsync();
        if (await r.ReadAsync())
            Console.WriteLine($"  DB: {r.GetString(0)}, User: {r.GetString(1)}");
        await r.CloseAsync();

        await using var cmd2 = new NpgsqlCommand(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name", conn);
        await using var r2 = await cmd2.ExecuteReaderAsync();
        Console.WriteLine("  Tables:");
        var count = 0;
        while (await r2.ReadAsync()) { Console.WriteLine("    - " + r2.GetString(0)); count++; }
        if (count == 0) Console.WriteLine("    (none)");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"  => FAILED: {ex.GetType().Name} - {ex.Message}");
    }
}
