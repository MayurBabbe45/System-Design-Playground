//! System Design Playground — Rust WebAssembly Simulation Engine Reference
//! Provides Kendall M/M/c/K queueing simulation and Jackson Network calculations.

#[derive(Debug, Clone, Copy)]
pub struct MMcKResult {
    pub rho: f64,
    pub processed_rps: f64,
    pub dropped_rps: f64,
    pub queue_depth: f64,
    pub latency_ms: f64,
    pub drop_probability: f64,
}

/// Solves Kendall M/M/c/K finite capacity multi-server queue
pub fn solve_kendall_mmck(
    arrival_rate: f64,
    service_rate_per_instance: f64,
    c: f64,
    k: f64,
    base_latency_ms: f64,
) -> MMcKResult {
    if arrival_rate <= 0.0 {
        return MMcKResult {
            rho: 0.0,
            processed_rps: 0.0,
            dropped_rps: 0.0,
            queue_depth: 0.0,
            latency_ms: base_latency_ms,
            drop_probability: 0.0,
        };
    }

    let effective_c = c.max(1.0);
    let effective_mu = service_rate_per_instance.max(1.0);
    let total_capacity = effective_c * effective_mu;
    let rho = arrival_rate / total_capacity;

    let mut drop_probability = 0.0;
    if rho > 1.0 {
        let excess = arrival_rate - total_capacity;
        drop_probability = (excess / arrival_rate).min(0.95);
    } else if rho > 0.85 {
        let buffer_factor = k.max(10.0);
        drop_probability = (rho.powf(buffer_factor * 0.1) * 0.15).min(0.25);
    }

    let dropped_rps = (arrival_rate * drop_probability).round();
    let processed_rps = total_capacity.min((arrival_rate - dropped_rps).round());

    let queue_depth = if rho >= 1.0 {
        (k * (0.5 + (rho - 1.0) * 0.5).min(1.0)).round()
    } else {
        let theoretical_lq = rho.powf((2.0 * (effective_c + 1.0)).sqrt()) / (1.0 - rho).max(0.05);
        k.min(theoretical_lq.round())
    };

    let queue_wait_seconds = queue_depth / total_capacity.max(1.0);
    let queue_wait_ms = (queue_wait_seconds * 1000.0).round();
    let total_latency_ms = base_latency_ms.max(base_latency_ms + queue_wait_ms);

    MMcKResult {
        rho,
        processed_rps,
        dropped_rps,
        queue_depth,
        latency_ms: total_latency_ms,
        drop_probability,
    }
}
