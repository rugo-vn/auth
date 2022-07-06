## Constants

<dl>
<dt><a href="#forbidden">forbidden</a> ⇒ <code><a href="#Result">Result</a></code></dt>
<dd><p>Return forbidden result.</p>
</dd>
<dt><a href="#badRequest">badRequest</a> ⇒ <code><a href="#Result">Result</a></code></dt>
<dd><p>Return bad request result.</p>
</dd>
<dt><a href="#verifyToken">verifyToken</a> ⇒ <code>object</code></dt>
<dd><p>Verify token</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Result">Result</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="forbidden"></a>

## forbidden ⇒ [<code>Result</code>](#Result)
Return forbidden result.

**Kind**: global constant  
**Returns**: [<code>Result</code>](#Result) - return data.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | Message or data to response. |

<a name="badRequest"></a>

## badRequest ⇒ [<code>Result</code>](#Result)
Return bad request result.

**Kind**: global constant  
**Returns**: [<code>Result</code>](#Result) - return data.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | Message or data to response. |

<a name="verifyToken"></a>

## verifyToken ⇒ <code>object</code>
Verify token

**Kind**: global constant  
**Returns**: <code>object</code> - return object or false  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | token to verify |
| secret | <code>string</code> | secret of token |

<a name="Result"></a>

## Result : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | <code>number</code> | Status code. |
| data | <code>\*</code> | Message or any data. |

