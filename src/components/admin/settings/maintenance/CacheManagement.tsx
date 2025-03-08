import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw, AlertCircle, Clock, Zap, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bytesToSize, formatTimeAgo } from "@/lib/utils";

// Cache type definition
interface CacheItem {
  id: string;
  name: string;
  size: number;
  items: number;
  lastCleared: Date;
  hit_rate: number;
  status: "active" | "inactive";
}

// Cache settings type
interface CacheSettings {
  enableCaching: boolean;
  cacheTTL: number;
  maxCacheSize: number;
  purgeInterval: number;
  autoCleanupEnabled: boolean;
  excludedPaths: string[];
}

export default function CacheManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [clearingCacheId, setClearingCacheId] = useState<string | null>(null);
  const [confirmClearAllCache, setConfirmClearAllCache] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  
  // Cache data
  const [caches, setCaches] = useState<CacheItem[]>([
    {
      id: "app-cache",
      name: "Application Cache",
      size: 2456000,
      items: 128,
      lastCleared: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
      hit_rate: 92,
      status: "active"
    },
    {
      id: "db-cache",
      name: "Database Query Cache",
      size: 18500000,
      items: 3246,
      lastCleared: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      hit_rate: 85,
      status: "active"
    },
    {
      id: "session-cache",
      name: "Session Cache",
      size: 5800000,
      items: 247,
      lastCleared: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      hit_rate: 98,
      status: "active"
    },
    {
      id: "static-cache",
      name: "Static Assets Cache",
      size: 127500000,
      items: 892,
      lastCleared: new Date(Date.now() - 3600000 * 24 * 5), // 5 days ago
      hit_rate: 99,
      status: "active"
    }
  ]);
  
  // Cache settings
  const [cacheSettings, setCacheSettings] = useState<CacheSettings>({
    enableCaching: true,
    cacheTTL: 3600,
    maxCacheSize: 500,
    purgeInterval: 24,
    autoCleanupEnabled: true,
    excludedPaths: ['/api/admin/*', '/api/stream/*']
  });
  
  // Cache statistics
  const [cacheStats, setCacheStats] = useState({
    totalSize: 0,
    totalItems: 0,
    avgHitRate: 0,
    lastRefreshed: new Date()
  });
  
  // Calculate cache statistics
  useEffect(() => {
    if (caches.length === 0) return;
    
    const totalSize = caches.reduce((acc, cache) => acc + cache.size, 0);
    const totalItems = caches.reduce((acc, cache) => acc + cache.items, 0);
    const avgHitRate = caches.reduce((acc, cache) => acc + cache.hit_rate, 0) / caches.length;
    
    setCacheStats({
      totalSize,
      totalItems,
      avgHitRate,
      lastRefreshed: new Date()
    });
  }, [caches]);
  
  // Setup refresh interval
  useEffect(() => {
    // Auto-refresh cache stats every 30 seconds
    const interval = setInterval(() => {
      refreshCacheStats();
    }, 30000);
    
    setRefreshInterval(interval);
    
    // Cleanup
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);
  
  // Refresh cache statistics
  const refreshCacheStats = () => {
    setIsLoading(true);
    
    // Simulate API call to refresh statistics
    setTimeout(() => {
      // Update cache stats with small random changes
      setCaches(caches.map(cache => ({
        ...cache,
        size: cache.size + Math.floor(Math.random() * 100000 - 50000),
        items: cache.items + Math.floor(Math.random() * 10 - 5),
        hit_rate: Math.min(100, Math.max(50, cache.hit_rate + Math.floor(Math.random() * 4 - 2)))
      })));
      
      setCacheStats({
        ...cacheStats,
        lastRefreshed: new Date()
      });
      
      setIsLoading(false);
    }, 800);
  };
  
  // Clear a specific cache
  const clearCache = (cacheId: string) => {
    setIsClearingCache(true);
    setClearingCacheId(cacheId);
    setClearProgress(0);
    
    // Simulate cache clearing process
    const interval = setInterval(() => {
      setClearProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10) + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Update cache data
            setCaches(caches.map(cache => 
              cache.id === cacheId 
                ? { 
                    ...cache, 
                    size: Math.floor(cache.size * 0.05), // Reduce to 5% of original size
                    items: Math.floor(cache.items * 0.05),
                    lastCleared: new Date()
                  } 
                : cache
            ));
            
            setIsClearingCache(false);
            setClearingCacheId(null);
            
            toast({
              title: "Cache Cleared",
              description: `The ${caches.find(c => c.id === cacheId)?.name} has been cleared successfully.`
            });
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };
  
  // Clear all caches
  const clearAllCaches = () => {
    setIsClearingCache(true);
    setClearingCacheId("all");
    setClearProgress(0);
    setConfirmClearAllCache(false);
    
    // Simulate clearing all caches
    const interval = setInterval(() => {
      setClearProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 5) + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Update all caches
            setCaches(caches.map(cache => ({ 
              ...cache, 
              size: Math.floor(cache.size * 0.02), // Reduce to 2% of original size
              items: Math.floor(cache.items * 0.02),
              lastCleared: new Date()
            })));
            
            setIsClearingCache(false);
            setClearingCacheId(null);
            
            toast({
              title: "All Caches Cleared",
              description: "All system caches have been cleared successfully."
            });
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 150);
  };
  
  // Handle cache settings change
  const handleSettingChange = (key: keyof CacheSettings, value: any) => {
    setCacheSettings({
      ...cacheSettings,
      [key]: value
    });
    setSettingsChanged(true);
  };

  // Handle excluded path change
  const handleExcludedPathsChange = (value: string) => {
    const paths = value.split(',').map(p => p.trim()).filter(p => p !== '');
    setCacheSettings({
      ...cacheSettings,
      excludedPaths: paths
    });
    setSettingsChanged(true);
  };
  
  // Save cache settings
  const saveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSettingsChanged(false);
      
      toast({
        title: "Settings Saved",
        description: "Cache settings have been updated successfully."
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Cache Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Cache Overview</CardTitle>
            <CardDescription>
              Current cache status and statistics
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshCacheStats}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setConfirmClearAllCache(true)}
              disabled={isLoading || isClearingCache}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Total Cache Size</p>
                  <p className="text-2xl font-bold">{bytesToSize(cacheStats.totalSize)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Cached Items</p>
                  <p className="text-2xl font-bold">{cacheStats.totalItems.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Average Hit Rate</p>
                  <p className="text-2xl font-bold">{cacheStats.avgHitRate.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Status</p>
                  <p className="text-2xl font-bold flex justify-center">
                    <Badge className="bg-green-500">
                      {cacheSettings.enableCaching ? "Enabled" : "Disabled"}
                    </Badge>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {isClearingCache && (
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium">
                Clearing {clearingCacheId === "all" ? "all caches" : `${caches.find(c => c.id === clearingCacheId)?.name}`}...
              </p>
              <Progress value={clearProgress} />
              <p className="text-xs text-muted-foreground">{clearProgress}% complete</p>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Cache Details</h3>
            <div className="grid grid-cols-1 gap-4">
              {caches.map(cache => (
                <Card key={cache.id}>
                  <CardContent className="pt-6 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="space-y-1">
                        <h4 className="font-medium">{cache.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last Cleared: {formatTimeAgo(cache.lastCleared)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:col-span-2">
                        <div>
                          <p className="text-sm font-medium">Size</p>
                          <p className="text-sm">{bytesToSize(cache.size)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Items</p>
                          <p className="text-sm">{cache.items.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Hit Rate</p>
                          <p className="text-sm">{cache.hit_rate}%</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => clearCache(cache.id)}
                          disabled={isClearingCache}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground flex justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {formatTimeAgo(cacheStats.lastRefreshed)}
          </div>
          {confirmClearAllCache && (
            <div className="flex items-center gap-2">
              <p className="font-medium text-destructive">Confirm clearing all caches?</p>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={clearAllCaches}
              >
                Yes, Clear All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setConfirmClearAllCache(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Cache Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Cache Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide caching parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableCaching">Enable Caching</Label>
              <p className="text-sm text-muted-foreground">
                Turn caching on or off system-wide
              </p>
            </div>
            <Switch
              id="enableCaching"
              checked={cacheSettings.enableCaching}
              onCheckedChange={(checked) => handleSettingChange("enableCaching", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoCleanup">Automatic Cache Cleanup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically clear expired cache items
              </p>
            </div>
            <Switch
              id="autoCleanup"
              checked={cacheSettings.autoCleanupEnabled}
              onCheckedChange={(checked) => handleSettingChange("autoCleanupEnabled", checked)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
              <Input
                id="cacheTTL"
                type="number"
                value={cacheSettings.cacheTTL}
                onChange={(e) => handleSettingChange("cacheTTL", parseInt(e.target.value))}
                min="60"
                max="86400"
              />
              <p className="text-xs text-muted-foreground">
                Time-to-live for cached items
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxCacheSize">Max Cache Size (MB)</Label>
              <Input
                id="maxCacheSize"
                type="number"
                value={cacheSettings.maxCacheSize}
                onChange={(e) => handleSettingChange("maxCacheSize", parseInt(e.target.value))}
                min="100"
                max="10000"
              />
              <p className="text-xs text-muted-foreground">
                Maximum total cache size before cleanup
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purgeInterval">Purge Interval (hours)</Label>
              <Select
                value={cacheSettings.purgeInterval.toString()}
                onValueChange={(value) => handleSettingChange("purgeInterval", parseInt(value))}
              >
                <SelectTrigger id="purgeInterval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often automatic cache cleaning runs
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excludedPaths">Excluded Paths (comma-separated)</Label>
            <Input
              id="excludedPaths"
              value={cacheSettings.excludedPaths.join(', ')}
              onChange={(e) => handleExcludedPathsChange(e.target.value)}
              placeholder="/api/admin/*, /api/realtime/*"
            />
            <p className="text-xs text-muted-foreground">
              URL patterns that should not be cached
            </p>
          </div>
          
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Performance Impact</AlertTitle>
            <AlertDescription>
              Optimizing cache settings can significantly improve application performance.
              Caching high-traffic data can reduce database load and improve response times.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={saveSettings} 
            disabled={!settingsChanged || isLoading}
          >
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 